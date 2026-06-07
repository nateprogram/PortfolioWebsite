// POST /api/applications/ingest
//
// Machine-to-machine ingest for the Gmail Apps Script. The script scans
// the inbox, classifies each email with Gemini, and POSTs the result
// here; we map its status vocabulary onto our pipeline enum and upsert
// the record (deduped by Gmail thread id).
//
// AUTH IS DIFFERENT FROM THE REST OF THE TRACKER. The browser endpoints
// use the resume_session cookie. The Apps Script has no cookie, so this
// route uses a bearer secret instead:
//
//   Authorization: Bearer <APPLICATIONS_INGEST_SECRET>
//
// Set APPLICATIONS_INGEST_SECRET in Vercel (and .env.local), and the
// same value as the TRACKER_INGEST_SECRET script property in Apps Script.
// If the env var is unset, the route refuses all requests (fails closed).
//
// Request body (from the Apps Script):
//   {
//     gmailThreadId: string,   // required — dedup key
//     company?: string,
//     role?: string,           // we also accept `position`
//     status?: string,         // Apps Script vocab (Applied/Screening/...)
//     detail?: string,         // short classifier note
//     emailLink?: string,
//     appliedDate?: string,    // YYYY-MM-DD, first message in thread
//   }
//
// Response: { item: Application } | { error }

import crypto from "node:crypto";
import {
  upsertFromGmail,
  type ApplicationStatus,
} from "@/lib/applications-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isIngestAuthorized(req)) {
    return jsonError(401, "Unauthorized.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }
  const input = body as Record<string, unknown>;

  const gmailThreadId =
    typeof input.gmailThreadId === "string" ? input.gmailThreadId.trim() : "";
  if (!gmailThreadId) {
    return jsonError(400, "`gmailThreadId` is required.");
  }

  const company = str(input.company);
  // Accept either `role` (Apps Script) or `position` (our vocab).
  const position = str(input.role) || str(input.position);

  const item = await upsertFromGmail({
    gmailThreadId,
    company,
    position,
    status: mapGmailStatus(str(input.status)),
    sourceDetail: str(input.detail) || undefined,
    emailLink: str(input.emailLink) || undefined,
    appliedDate: isoDate(input.appliedDate),
  });

  if (!item) {
    return jsonError(
      503,
      "Could not save. Is the KV store configured on the server?",
    );
  }
  return new Response(JSON.stringify({ item }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Constant-time bearer check against APPLICATIONS_INGEST_SECRET.
 * Fails closed when the env var is missing.
 */
function isIngestAuthorized(req: Request): boolean {
  const secret = process.env.APPLICATIONS_INGEST_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!m) return false;
  const provided = m[1];

  if (provided.length !== secret.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(secret, "utf8"),
    );
  } catch {
    return false;
  }
}

/**
 * Map the Apps Script's richer status vocabulary onto our 5-stage enum.
 *   Applied              → applied
 *   Screening            → interview  (recruiter/phone screen = active funnel)
 *   Interview            → interview
 *   Offer                → offer
 *   Rejected / Withdrawn → rejected
 *   Other / unknown      → applied    (job-related but unclear; stays visible)
 * The original nuance ("phone screen", "2nd round") is preserved in the
 * record's sourceDetail field regardless.
 */
function mapGmailStatus(raw: string): ApplicationStatus {
  switch (raw.toLowerCase()) {
    case "applied":
      return "applied";
    case "screening":
      return "interview";
    case "interview":
      return "interview";
    case "offer":
      return "offer";
    case "rejected":
    case "withdrawn":
      return "rejected";
    default:
      return "applied";
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isoDate(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : undefined;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
