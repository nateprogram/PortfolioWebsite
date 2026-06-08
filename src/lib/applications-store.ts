// SERVER-ONLY: KV-backed CRUD for the application tracker. Schema:
//   application:list   ZADD-like ordered list of IDs, newest first.
//   application:<id>   JSON-serialized Application record.
//
// Same KV bucket as the resume history (shared Upstash database), just
// a different key prefix so the two don't collide. The free-tier
// MAX_RETAINED cap is generous (500 entries) since application records
// are small-ish (~1-10KB depending on whether materials are populated).
//
// Like resume-store, all functions degrade gracefully when KV env vars
// are absent: list/get return empty, save/update/delete log a warning
// and return null.
//
// Status migration (2026-05): the canonical status set collapsed from
// 7 values (applied/screen/interview/offer/rejected/withdrawn/ghosted)
// to 5 values (interested/applied/interview/rejected/offer). Old records
// are normalized on read via `normalizeLegacyStatus` — never on write —
// so we can roll back without data loss. New writes must use the new
// enum; the route handlers reject legacy strings.

import { kv } from "@vercel/kv";

const LIST_KEY = "application:list";
const ITEM_PREFIX = "application:";
// Secondary index: maps a Gmail thread id to its application id, so the
// /ingest endpoint can upsert (update an existing row when a newer email
// arrives) instead of creating duplicates. Key: application:gmail:<tid>.
const GMAIL_INDEX_PREFIX = "application:gmail:";
// Secondary index: maps a normalized "company::position" key to its
// application id, so multiple Gmail threads about the SAME job collapse into
// one row. Different positions at the same company get different keys and
// stay separate. Key: application:cp:<company::position>.
const CP_INDEX_PREFIX = "application:cp:";
const MAX_RETAINED = 500;

/**
 * Canonical status set. Stages 1-3 are sequential; stage 4 is terminal
 * and forks into two outcomes (rejected | offer). UI renders this as
 * four columns with the last column showing both outcomes.
 */
export type ApplicationStatus =
  | "interested"
  | "applied"
  | "interview"
  | "rejected"
  | "offer";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "rejected",
  "offer",
];

/**
 * Legacy statuses still present in older KV records. Mapped to the new
 * set on read. Never written.
 */
type LegacyStatus = "screen" | "withdrawn" | "ghosted";

function normalizeLegacyStatus(s: string): ApplicationStatus {
  if ((APPLICATION_STATUSES as string[]).includes(s)) {
    return s as ApplicationStatus;
  }
  const legacy = s as LegacyStatus;
  // screen is part of interviewing; withdrawn/ghosted are terminal rejections.
  if (legacy === "screen") return "interview";
  if (legacy === "withdrawn") return "rejected";
  if (legacy === "ghosted") return "rejected";
  // Anything else (corrupt or future) falls back to "applied" so the
  // record stays visible and editable rather than disappearing.
  return "applied";
}

/**
 * Where an application record came from. "manual" = typed into the form,
 * "url" = created from a pasted JD link, "gmail" = ingested from the Gmail
 * Apps Script. Undefined on legacy records (treat as "manual").
 */
export type ApplicationSource = "manual" | "url" | "gmail";

export type Application = {
  /** Unique ID, sortable by timestamp prefix. */
  id: string;
  /** Unix ms when first created. */
  createdAt: number;
  /** Unix ms when last edited. */
  updatedAt: number;

  // ----- Core (always present) -----
  /** Company name. */
  company: string;
  /** Role title. */
  position: string;
  /** Pipeline status. */
  status: ApplicationStatus;

  // ----- Provenance -----
  /** How this record was created. Undefined on legacy rows = "manual". */
  source?: ApplicationSource;
  /** Gmail thread id, set only for source==="gmail". Dedup key. */
  gmailThreadId?: string;
  /** Requisition / job id parsed from the email, when present. The most
   *  reliable dedup signal: two different reqs at the same company stay
   *  separate even when the classifier gives them the same title. */
  jobId?: string;
  /** Deep link to the Gmail thread (source==="gmail"). */
  emailLink?: string;
  /** Short classifier note from the Gmail scan ("phone screen", "onsite",
   *  "take-home"). Kept separate from `notes` so a re-scan never clobbers
   *  the user's own notes. */
  sourceDetail?: string;

  // ----- Dates -----
  /** ISO date (YYYY-MM-DD) when the application was submitted. */
  appliedDate?: string;
  /** ISO date (YYYY-MM-DD) — application deadline if the JD names one. */
  deadline?: string;

  // ----- Source -----
  /** Original JD URL the entry was created from. */
  jdUrl?: string;
  /** Full extracted JD text. Stored verbatim so we can re-extract or
   *  hand it to /api/cover-letter without refetching the URL. */
  rawJdText?: string;

  // ----- Extracted metadata (LLM-populated, user-editable) -----
  /** "Seattle, WA" / "Remote" / "Hybrid (NYC)" etc. */
  location?: string;
  /** Annual salary band, numbers in USD. */
  salaryMin?: number;
  salaryMax?: number;
  /** Free text — "2-3", "5-7", "Senior", "New grad", "Equivalent practical
   *  experience". JDs vary too much to enforce a numeric range. */
  experienceYears?: string;
  /** Tags pulled from the JD (e.g. ["C++", "Spring Boot", "AWS"]). */
  requiredSkills?: string[];

  // ----- Materials (user-edited or LLM-generated) -----
  /** Free-text notes — interviewers, recruiter names, anything. */
  notes?: string;
  /** Cover letter markdown (full text). */
  coverLetterMarkdown?: string;
  /** Tailored resume markdown (META + ATS keywords + body). */
  resumeMarkdown?: string;
  /** Optional ID of a saved resume in resume-store. Pre-dates inline
   *  markdown storage; kept for back-compat with existing records. */
  resumeId?: string;
};

export type ApplicationCreate = Omit<
  Application,
  "id" | "createdAt" | "updatedAt" | "status"
> & {
  status?: ApplicationStatus;
};

export type ApplicationUpdate = Partial<
  Omit<Application, "id" | "createdAt" | "updatedAt">
>;

function kvAvailable(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

function newId(now: number): string {
  const ts = now.toString(36).padStart(8, "0");
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

/**
 * Normalize a record loaded from KV: maps legacy statuses to the new
 * enum and ensures all expected fields exist on the object. Cheap; runs
 * on every read.
 */
function normalize(raw: Application): Application {
  return {
    ...raw,
    status: normalizeLegacyStatus(raw.status as unknown as string),
  };
}

/** Create a new application record. Returns the saved record or null. */
export async function createApplication(
  input: ApplicationCreate,
): Promise<Application | null> {
  if (!kvAvailable()) {
    console.warn("[applications] KV not configured; skipping create.");
    return null;
  }
  const company = input.company.trim();
  const position = input.position.trim();
  if (!company || !position) {
    throw new Error("company and position are required");
  }
  const now = Date.now();
  const id = newId(now);
  const record: Application = {
    id,
    createdAt: now,
    updatedAt: now,
    company,
    position,
    status: input.status ?? "interested",
    source: input.source ?? "manual",
    gmailThreadId: input.gmailThreadId,
    emailLink: input.emailLink,
    sourceDetail: input.sourceDetail,
    appliedDate: input.appliedDate,
    deadline: input.deadline,
    jdUrl: input.jdUrl,
    rawJdText: input.rawJdText,
    location: input.location,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    experienceYears: input.experienceYears,
    requiredSkills: input.requiredSkills,
    notes: input.notes,
    coverLetterMarkdown: input.coverLetterMarkdown,
    resumeMarkdown: input.resumeMarkdown,
    resumeId: input.resumeId,
  };
  try {
    await kv.set(`${ITEM_PREFIX}${id}`, record);
    await kv.lpush(LIST_KEY, id);
    await kv.ltrim(LIST_KEY, 0, MAX_RETAINED - 1);
    return record;
  } catch (err) {
    console.warn("[applications] create failed:", (err as Error).message);
    return null;
  }
}

/** Returns recent applications, newest first. Legacy statuses normalized. */
export async function listApplications(limit = 200): Promise<Application[]> {
  if (!kvAvailable()) return [];
  try {
    const ids = (await kv.lrange<string>(LIST_KEY, 0, limit - 1)) ?? [];
    if (ids.length === 0) return [];
    const records = await Promise.all(
      ids.map((id) => kv.get<Application>(`${ITEM_PREFIX}${id}`)),
    );
    return records
      .filter((r): r is Application => r !== null)
      .map(normalize);
  } catch (err) {
    console.warn("[applications] list failed:", (err as Error).message);
    return [];
  }
}

export async function getApplication(id: string): Promise<Application | null> {
  if (!kvAvailable()) return null;
  try {
    const raw = await kv.get<Application>(`${ITEM_PREFIX}${id}`);
    return raw ? normalize(raw) : null;
  } catch (err) {
    console.warn("[applications] get failed:", (err as Error).message);
    return null;
  }
}

export async function updateApplication(
  id: string,
  patch: ApplicationUpdate,
): Promise<Application | null> {
  if (!kvAvailable()) return null;
  try {
    const existing = await kv.get<Application>(`${ITEM_PREFIX}${id}`);
    if (!existing) return null;
    const updated: Application = {
      ...existing,
      ...patch,
      // Preserve immutable fields even if a caller sends them.
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    await kv.set(`${ITEM_PREFIX}${id}`, updated);
    return normalize(updated);
  } catch (err) {
    console.warn("[applications] update failed:", (err as Error).message);
    return null;
  }
}

/**
 * Delete ALL application rows + every secondary index. Destructive — used for
 * a clean rebuild before re-running the Gmail scan from scratch. Returns the
 * number of keys removed (0 if nothing), or -1 if KV isn't configured.
 */
export async function wipeAllApplications(): Promise<number> {
  if (!kvAvailable()) return -1;
  let removed = 0;
  let cursor: string | number = 0;
  try {
    do {
      // Every key this module writes is under the "application:" prefix
      // (rows, the list, the gmail index, the company/position+job indexes).
      const [next, keys] = (await kv.scan(cursor, {
        match: `${ITEM_PREFIX}*`,
        count: 200,
      })) as [string | number, string[]];
      cursor = next;
      if (keys.length > 0) {
        await kv.del(...keys);
        removed += keys.length;
      }
    } while (String(cursor) !== "0");
    return removed;
  } catch (err) {
    console.warn("[applications] wipe failed:", (err as Error).message);
    return removed;
  }
}

export async function deleteApplication(id: string): Promise<boolean> {
  if (!kvAvailable()) return false;
  try {
    // Clean up the secondary indexes too, so a delete doesn't leave a stale
    // thread- or company+position-index entry pointing at a dead record.
    const existing = await kv.get<Application>(`${ITEM_PREFIX}${id}`);
    const ops: Promise<unknown>[] = [
      kv.del(`${ITEM_PREFIX}${id}`),
      kv.lrem(LIST_KEY, 0, id),
    ];
    if (existing?.gmailThreadId) {
      ops.push(kv.del(`${GMAIL_INDEX_PREFIX}${existing.gmailThreadId}`));
    }
    if (existing) {
      const jk = jobKeyOf(existing.company, existing.jobId);
      if (jk) ops.push(kv.del(`${CP_INDEX_PREFIX}${jk}`));
      // Only drop the shared position key if it actually points at this row,
      // so we don't orphan a different row that shares the same title.
      const pk = posKeyOf(existing.company, existing.position);
      if (pk && (await kv.get<string>(`${CP_INDEX_PREFIX}${pk}`)) === id) {
        ops.push(kv.del(`${CP_INDEX_PREFIX}${pk}`));
      }
    }
    await Promise.all(ops);
    return true;
  } catch (err) {
    console.warn("[applications] delete failed:", (err as Error).message);
    return false;
  }
}

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Precise dedup key: company + requisition id. Null when either is missing
 * or unknown. This is the strongest signal — two different reqs at the same
 * company get different keys even if the classifier gave them the same title.
 */
function jobKeyOf(company: string, jobId?: string): string | null {
  const c = normKey(company);
  const j = normKey(jobId ?? "");
  if (!c || c === "(unknown)" || !j) return null;
  return `${c}::job:${j}`;
}

/**
 * Fallback dedup key: company + position. Null when either is missing or
 * unknown. Used when an email has no req id, so two threads about the same
 * titled role still collapse into one row.
 */
function posKeyOf(company: string, position: string): string | null {
  const c = normKey(company);
  const p = normKey(position);
  if (!c || c === "(unknown)" || !p || p === "(unknown)") return null;
  return `${c}::${p}`;
}

/**
 * Point the dedup indexes at a row. The job-id key is unique to the row so it
 * always points here. The position key is a SHARED fallback — only claim it
 * if it's currently unset, so the first row for a given title stays the merge
 * target for future req-id-less emails (and a second, distinct req with the
 * same title doesn't steal it).
 */
async function indexKeys_(app: Application, id: string): Promise<void> {
  const jk = jobKeyOf(app.company, app.jobId);
  if (jk) await kv.set(`${CP_INDEX_PREFIX}${jk}`, id);
  const pk = posKeyOf(app.company, app.position);
  if (pk) {
    const existing = await kv.get<string>(`${CP_INDEX_PREFIX}${pk}`);
    if (!existing) await kv.set(`${CP_INDEX_PREFIX}${pk}`, id);
  }
}

/**
 * Payload the Gmail ingest endpoint hands to the store. A normalized
 * subset of Application: status is already mapped to our enum by the
 * route, and `gmailThreadId` is required (it's the dedup key).
 */
export type GmailIngest = {
  gmailThreadId: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  sourceDetail?: string;
  emailLink?: string;
  /** Requisition / job id from the email, if the classifier found one. */
  jobId?: string;
  /** ISO date YYYY-MM-DD — first message in the thread (= date applied). */
  appliedDate?: string;
};

/**
 * Create-or-update an application from a Gmail scan. Dedup is layered so the
 * tracker holds one row per real application:
 *
 *   1. SAME THREAD seen before → update that exact row. Robust to the LLM
 *      naming the company/position slightly differently across scans.
 *   2. Else, an existing row with the SAME company+position (a different
 *      email thread about the same job) → merge into it. Skipped when either
 *      field is "(unknown)", so vague emails never collapse together.
 *   3. Else → create a new row. Different positions at the same company hit
 *      this path (different company+position key) and stay separate.
 *
 * User edits (notes, materials, salary, etc.) and the original appliedDate
 * always survive a re-scan untouched.
 *
 * Returns the saved record, or null if KV is unavailable / the write fails.
 * Never throws on KV errors (mirrors the rest of this module).
 */
export async function upsertFromGmail(
  input: GmailIngest,
): Promise<Application | null> {
  if (!kvAvailable()) {
    console.warn("[applications] KV not configured; skipping gmail upsert.");
    return null;
  }
  const tid = input.gmailThreadId.trim();
  if (!tid) throw new Error("gmailThreadId is required");

  const company = input.company.trim() || "(unknown)";
  const position = input.position.trim() || "(unknown)";
  const jobId = input.jobId?.trim() || undefined;
  const jobKey = jobKeyOf(company, jobId);
  const posKey = posKeyOf(company, position);

  try {
    // Find the row this email belongs to, strongest signal first:
    //   1. same Gmail thread
    //   2. same company + requisition id
    //   3. same company + position (title)
    let targetId = await kv.get<string>(`${GMAIL_INDEX_PREFIX}${tid}`);
    if (!targetId && jobKey) {
      targetId = await kv.get<string>(`${CP_INDEX_PREFIX}${jobKey}`);
    }
    if (!targetId && posKey) {
      const pid = await kv.get<string>(`${CP_INDEX_PREFIX}${posKey}`);
      if (pid) {
        // Matched on title alone. If THIS email has a req id and the matched
        // row has a DIFFERENT one, they're different jobs that happen to
        // share a title (e.g. two Amazon SDE reqs) — don't merge.
        const cand = await kv.get<Application>(`${ITEM_PREFIX}${pid}`);
        const candJob = (cand?.jobId ?? "").trim();
        if (!(jobId && candJob && jobId !== candJob)) {
          targetId = pid;
        }
      }
    }

    if (targetId) {
      const existing = await kv.get<Application>(`${ITEM_PREFIX}${targetId}`);
      if (existing) {
        const updated: Application = {
          ...existing,
          // Mutable fields refreshed from the latest email.
          status: input.status,
          company: input.company.trim() || existing.company,
          position: input.position.trim() || existing.position,
          jobId: jobId ?? existing.jobId,
          sourceDetail: input.sourceDetail ?? existing.sourceDetail,
          emailLink: input.emailLink ?? existing.emailLink,
          // Keep the earliest appliedDate we ever saw.
          appliedDate: existing.appliedDate ?? input.appliedDate,
          source: "gmail",
          gmailThreadId: tid,
          updatedAt: Date.now(),
        };
        await kv.set(`${ITEM_PREFIX}${targetId}`, updated);
        await kv.set(`${GMAIL_INDEX_PREFIX}${tid}`, targetId);
        await indexKeys_(updated, targetId);
        return normalize(updated);
      }
      // Index pointed at a record that no longer exists (e.g. user deleted
      // it). Fall through and recreate.
    }

    // New application.
    const now = Date.now();
    const id = newId(now);
    const record: Application = {
      id,
      createdAt: now,
      updatedAt: now,
      company,
      position,
      status: input.status,
      source: "gmail",
      gmailThreadId: tid,
      jobId,
      emailLink: input.emailLink,
      sourceDetail: input.sourceDetail,
      appliedDate: input.appliedDate,
    };
    await kv.set(`${ITEM_PREFIX}${id}`, record);
    await kv.lpush(LIST_KEY, id);
    await kv.ltrim(LIST_KEY, 0, MAX_RETAINED - 1);
    await kv.set(`${GMAIL_INDEX_PREFIX}${tid}`, id);
    await indexKeys_(record, id);
    return record;
  } catch (err) {
    console.warn("[applications] gmail upsert failed:", (err as Error).message);
    return null;
  }
}
