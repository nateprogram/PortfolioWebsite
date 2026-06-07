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

export async function deleteApplication(id: string): Promise<boolean> {
  if (!kvAvailable()) return false;
  try {
    // Clean up the Gmail secondary index too, if this was a Gmail row.
    // Otherwise a stale index entry would survive the delete.
    const existing = await kv.get<Application>(`${ITEM_PREFIX}${id}`);
    const ops: Promise<unknown>[] = [
      kv.del(`${ITEM_PREFIX}${id}`),
      kv.lrem(LIST_KEY, 0, id),
    ];
    if (existing?.gmailThreadId) {
      ops.push(kv.del(`${GMAIL_INDEX_PREFIX}${existing.gmailThreadId}`));
    }
    await Promise.all(ops);
    return true;
  } catch (err) {
    console.warn("[applications] delete failed:", (err as Error).message);
    return false;
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
  /** ISO date YYYY-MM-DD — first message in the thread (= date applied). */
  appliedDate?: string;
};

/**
 * Create-or-update an application from a Gmail scan, deduped by thread id.
 *
 * - First time we see a thread: create a new row, index it by thread id.
 * - Thread seen before: update the mutable fields (status, role/company if
 *   they sharpened, the classifier detail, the email link) but PRESERVE
 *   the user's own edits — notes, materials, salary, location, deadline,
 *   and the original appliedDate all survive a re-scan untouched.
 *
 * Returns the saved record, or null if KV is unavailable / the write
 * fails. Never throws on KV errors (mirrors the rest of this module).
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

  try {
    const existingId = await kv.get<string>(`${GMAIL_INDEX_PREFIX}${tid}`);
    if (existingId) {
      const existing = await kv.get<Application>(`${ITEM_PREFIX}${existingId}`);
      if (existing) {
        const updated: Application = {
          ...existing,
          // Mutable fields refreshed from the latest email.
          status: input.status,
          company: input.company.trim() || existing.company,
          position: input.position.trim() || existing.position,
          sourceDetail: input.sourceDetail ?? existing.sourceDetail,
          emailLink: input.emailLink ?? existing.emailLink,
          // Keep the earliest appliedDate we ever saw.
          appliedDate: existing.appliedDate ?? input.appliedDate,
          source: "gmail",
          gmailThreadId: tid,
          updatedAt: Date.now(),
        };
        await kv.set(`${ITEM_PREFIX}${existingId}`, updated);
        return normalize(updated);
      }
      // Index pointed at a record that no longer exists (e.g. user deleted
      // it). Fall through and recreate.
    }

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
      emailLink: input.emailLink,
      sourceDetail: input.sourceDetail,
      appliedDate: input.appliedDate,
    };
    await kv.set(`${ITEM_PREFIX}${id}`, record);
    await kv.lpush(LIST_KEY, id);
    await kv.ltrim(LIST_KEY, 0, MAX_RETAINED - 1);
    await kv.set(`${GMAIL_INDEX_PREFIX}${tid}`, id);
    return record;
  } catch (err) {
    console.warn("[applications] gmail upsert failed:", (err as Error).message);
    return null;
  }
}
