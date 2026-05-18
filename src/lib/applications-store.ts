// SERVER-ONLY: KV-backed CRUD for the application tracker. Schema:
//   application:list   ZADD-like ordered list of IDs, newest first.
//   application:<id>   JSON-serialized Application record.
//
// Same KV bucket as the resume history (shared Upstash database), just
// a different key prefix so the two don't collide. The free-tier
// MAX_RETAINED cap is generous (500 entries) since application records
// are very small (~1KB each).
//
// Like resume-store, all functions degrade gracefully when KV env vars
// are absent: list/get return empty, save/update/delete log a warning
// and return null.

import { kv } from "@vercel/kv";

const LIST_KEY = "application:list";
const ITEM_PREFIX = "application:";
const MAX_RETAINED = 500;

export type ApplicationStatus =
  | "applied"
  | "screen"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "applied",
  "screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
];

export type Application = {
  /** Unique ID, sortable by timestamp prefix. */
  id: string;
  /** Unix ms when first created. */
  createdAt: number;
  /** Unix ms when last edited. */
  updatedAt: number;
  /** Company name (required). */
  company: string;
  /** Role title (required). */
  position: string;
  /** Pipeline status. Defaults to "applied" on create. */
  status: ApplicationStatus;
  /** ISO date string YYYY-MM-DD when the application was submitted. */
  appliedDate?: string;
  /** Original JD URL (optional). */
  jdUrl?: string;
  /** Free-text notes — interviewers, salary, deadlines, anything. */
  notes?: string;
  /** Optional ID of a saved resume (resume-store) used for this app. */
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
    status: input.status ?? "applied",
    appliedDate: input.appliedDate,
    jdUrl: input.jdUrl,
    notes: input.notes,
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

/** Returns recent applications, newest first. */
export async function listApplications(limit = 200): Promise<Application[]> {
  if (!kvAvailable()) return [];
  try {
    const ids = (await kv.lrange<string>(LIST_KEY, 0, limit - 1)) ?? [];
    if (ids.length === 0) return [];
    const records = await Promise.all(
      ids.map((id) => kv.get<Application>(`${ITEM_PREFIX}${id}`)),
    );
    return records.filter((r): r is Application => r !== null);
  } catch (err) {
    console.warn("[applications] list failed:", (err as Error).message);
    return [];
  }
}

export async function getApplication(id: string): Promise<Application | null> {
  if (!kvAvailable()) return null;
  try {
    return (await kv.get<Application>(`${ITEM_PREFIX}${id}`)) ?? null;
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
    return updated;
  } catch (err) {
    console.warn("[applications] update failed:", (err as Error).message);
    return null;
  }
}

export async function deleteApplication(id: string): Promise<boolean> {
  if (!kvAvailable()) return false;
  try {
    await Promise.all([
      kv.del(`${ITEM_PREFIX}${id}`),
      kv.lrem(LIST_KEY, 0, id),
    ]);
    return true;
  } catch (err) {
    console.warn("[applications] delete failed:", (err as Error).message);
    return false;
  }
}
