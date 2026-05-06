// SERVER-ONLY: auth gate for /tools/resume and /api/resume.
//
// Flow: visit `/api/resume/unlock?key=<RESUME_TOOL_KEY>` once per device.
// The route validates the key, sets a long-lived HTTP-only cookie whose
// value is an HMAC of a marker phrase keyed by the secret, and redirects
// to a clean URL. The page + the resume API both call `isAuthorized()`
// which re-derives the HMAC and compares with timing-safe equality.

import crypto from "node:crypto";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const RESUME_COOKIE_NAME = "resume_session";

// 90 days. Refresh by re-visiting the unlock URL.
export const RESUME_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

// Marker phrase mixed with the secret to form the cookie value. Constant
// so the cookie is reproducible across requests; the secret is what
// makes it unforgeable.
const MARKER = "nate-unlocked";

/**
 * Returns the cookie value to set when the user successfully unlocks.
 * Returns null if RESUME_TOOL_KEY isn't configured (so unlock fails closed).
 */
export function buildSessionToken(): string | null {
  const secret = process.env.RESUME_TOOL_KEY;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(MARKER).digest("hex");
}

/**
 * Read the session cookie and verify it matches the HMAC we'd produce
 * with the current secret. Constant-time comparison.
 */
export function isAuthorized(
  cookieStore:
    | ReadonlyRequestCookies
    | { get(name: string): { value: string } | undefined },
): boolean {
  const expected = buildSessionToken();
  if (!expected) return false;

  const cookie = cookieStore.get(RESUME_COOKIE_NAME);
  if (!cookie?.value) return false;

  const provided = cookie.value;

  // Buffer.from + timingSafeEqual requires equal-length buffers; otherwise
  // Node throws. Pre-check length so an attacker can't trigger an exception.
  if (provided.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

/**
 * Validate a raw key against the configured secret with constant-time
 * comparison. Used by the unlock route.
 */
export function isValidKey(provided: string | null): boolean {
  if (!provided) return false;
  const secret = process.env.RESUME_TOOL_KEY;
  if (!secret) return false;
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
