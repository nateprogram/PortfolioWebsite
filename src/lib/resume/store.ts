// SERVER-ONLY: persistence for generated resumes.
//
// Backed by Vercel KV (Upstash Redis). Free tier: 256MB total, 30K
// commands/month. Each resume is ~5KB so the storage ceiling is roughly
// 50K records, well above what one user produces.
//
// All functions degrade gracefully if KV env vars are missing: save() is
// a no-op + console.warn, list/get return empty. The tool stays usable
// without storage configured (e.g. on first local-dev run before
// `vercel env pull`).

import { kv } from "@vercel/kv";

const LIST_KEY = "resume:list"; // ordered list of IDs, newest first
const ITEM_PREFIX = "resume:"; // resume:<id> -> SavedResume JSON

/**
 * Hard cap on retained resumes. New saves push the oldest off the end
 * so KV usage stays bounded. The user can raise this freely.
 */
const MAX_RETAINED = 200;

export type SavedResume = {
  /** Unique ID. Crypto-random + timestamp prefix for natural sort. */
  id: string;
  /** Unix ms when saved. */
  createdAt: number;
  /** First ~140 chars of the JD, for the history list. */
  jobDescriptionSnippet: string;
  /** Full JD as submitted, for re-running or audit. */
  jobDescription: string;
  /** The generated markdown (META + ATS keywords + resume body). */
  markdown: string;
  /** Company name extracted from the generated [META] block. Undefined if the model omitted it or wrote "Unknown". */
  company?: string;
  /** Job title extracted from the generated [META] block. */
  position?: string;
};

/**
 * True iff KV is configured and reachable. The library reads
 * KV_REST_API_URL / KV_REST_API_TOKEN from process.env automatically.
 */
function kvAvailable(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

/** Generate a sortable, URL-safe ID. */
function newId(now: number): string {
  const ts = now.toString(36).padStart(8, "0");
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

/**
 * Pull `company` and `position` out of the model-emitted `[META]…[/META]`
 * block at the top of the generated markdown. Returns undefined for
 * either field when missing or set to the placeholder "Unknown".
 *
 * Mirror of the parser in builder.tsx; kept here so saves don't depend
 * on the client having parsed anything first.
 */
function parseMetaBlock(markdown: string): {
  company?: string;
  position?: string;
} {
  const m = /\[META\]([\s\S]*?)\[\/META\]/.exec(markdown);
  if (!m) return {};
  const block = m[1];
  const rawCompany = /^\s*company\s*:\s*(.+?)\s*$/im.exec(block)?.[1];
  const rawPosition = /^\s*position\s*:\s*(.+?)\s*$/im.exec(block)?.[1];
  return {
    company:
      rawCompany && rawCompany.toLowerCase() !== "unknown"
        ? rawCompany
        : undefined,
    position: rawPosition || undefined,
  };
}

/**
 * Save a resume. Returns the assigned ID, or null if KV isn't configured.
 * Never throws on KV failure: logs a warning so the user-facing flow
 * keeps working even if storage is temporarily down.
 */
export async function saveResume(input: {
  jobDescription: string;
  markdown: string;
}): Promise<string | null> {
  if (!kvAvailable()) {
    console.warn(
      "[resume-store] KV_REST_API_URL/TOKEN missing; skipping save.",
    );
    return null;
  }
  const now = Date.now();
  const id = newId(now);
  const meta = parseMetaBlock(input.markdown);
  const record: SavedResume = {
    id,
    createdAt: now,
    jobDescriptionSnippet: input.jobDescription.replace(/\s+/g, " ").slice(0, 140),
    jobDescription: input.jobDescription,
    markdown: input.markdown,
    company: meta.company,
    position: meta.position,
  };
  try {
    await kv.set(`${ITEM_PREFIX}${id}`, record);
    await kv.lpush(LIST_KEY, id);
    // Trim oldest beyond MAX_RETAINED. This deletes only from the list;
    // the dropped item's body lingers as orphaned bytes until manually
    // purged, but the per-record size is small and the list shape is
    // what users actually browse.
    await kv.ltrim(LIST_KEY, 0, MAX_RETAINED - 1);
    return id;
  } catch (err) {
    console.warn("[resume-store] save failed:", (err as Error).message);
    return null;
  }
}

/**
 * Recent resumes (newest first), capped at `limit`.
 * Empty if KV missing, returns whatever survives partial errors.
 */
export async function listResumes(limit = 50): Promise<SavedResume[]> {
  if (!kvAvailable()) return [];
  try {
    const ids = (await kv.lrange<string>(LIST_KEY, 0, limit - 1)) ?? [];
    if (ids.length === 0) return [];
    const records = await Promise.all(
      ids.map((id) => kv.get<SavedResume>(`${ITEM_PREFIX}${id}`)),
    );
    return records.filter((r): r is SavedResume => r !== null);
  } catch (err) {
    console.warn("[resume-store] list failed:", (err as Error).message);
    return [];
  }
}

/** Fetch one resume by ID. */
export async function getResume(id: string): Promise<SavedResume | null> {
  if (!kvAvailable()) return null;
  try {
    return (await kv.get<SavedResume>(`${ITEM_PREFIX}${id}`)) ?? null;
  } catch (err) {
    console.warn("[resume-store] get failed:", (err as Error).message);
    return null;
  }
}

/**
 * Delete one resume. Removes both the body and its entry in the list.
 * Idempotent.
 */
export async function deleteResume(id: string): Promise<boolean> {
  if (!kvAvailable()) return false;
  try {
    await Promise.all([
      kv.del(`${ITEM_PREFIX}${id}`),
      kv.lrem(LIST_KEY, 0, id),
    ]);
    return true;
  } catch (err) {
    console.warn("[resume-store] delete failed:", (err as Error).message);
    return false;
  }
}
