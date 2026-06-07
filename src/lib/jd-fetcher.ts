// SERVER-ONLY: shared fetcher for job-description URLs.
//
// Pulls visible text out of a job-posting URL. Wraps the fetch call,
// SSRF guard, size cap, content-type check, and html-to-text into one
// reusable async function used by both /api/resume/fetch-jd (manual
// paste flow) and /api/applications/from-url (LLM extraction flow).
//
// Returns a discriminated result. Callers translate to HTTP responses;
// this layer doesn't know about Request/Response objects.

import { htmlToText } from "@/lib/html-to-text";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2_000_000; // 2 MB
const MAX_TEXT_LEN = 12_000; // matches the JD length cap on /api/resume

export type FetchJdResult =
  | { ok: true; text: string }
  | {
      ok: false;
      /** Suggested HTTP status the calling route should return. */
      status: number;
      error: string;
    };

/**
 * Fetch + extract visible text from a JD URL. Performs all the safety
 * checks (URL validity, http(s) only, SSRF guard, size cap, content-type)
 * and returns either the extracted text or a structured failure.
 *
 * Never throws — failures always come back as { ok: false, ... }.
 */
export async function fetchJdText(rawUrl: string): Promise<FetchJdResult> {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { ok: false, status: 400, error: "URL is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, status: 400, error: "That doesn't look like a valid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, status: 400, error: "URL must use http or https." };
  }
  if (isPrivateHost(parsed.hostname)) {
    return {
      ok: false,
      status: 400,
      error: "Refusing to fetch private/internal hosts.",
    };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    clearTimeout(timer);
    const e = err as Error;
    return {
      ok: false,
      status: 502,
      error:
        e.name === "AbortError"
          ? `Timed out fetching the page after ${FETCH_TIMEOUT_MS / 1000}s.`
          : `Could not fetch URL: ${e.message}`,
    };
  }
  clearTimeout(timer);

  if (!res.ok) {
    return {
      ok: false,
      status: 502,
      error: `Page returned HTTP ${res.status}. Try copy-pasting the JD instead.`,
    };
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml/i.test(ct)) {
    return {
      ok: false,
      status: 415,
      error: `URL returned non-HTML content (${ct || "unknown"}). Paste the JD manually.`,
    };
  }

  const reader = res.body?.getReader();
  if (!reader) return { ok: false, status: 502, error: "Empty response body." };

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        return {
          ok: false,
          status: 413,
          error: `Page is larger than ${MAX_HTML_BYTES / 1_000_000}MB. Paste the JD manually.`,
        };
      }
      chunks.push(value);
    }
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: `Failed reading page body: ${(err as Error).message}`,
    };
  }

  const html = new TextDecoder("utf-8").decode(concat(chunks));
  const text = htmlToText(html).slice(0, MAX_TEXT_LEN);
  if (text.length < 100) {
    return {
      ok: false,
      status: 422,
      error:
        "Could not extract enough text from the page. It may be JS-rendered (e.g. Workday). Paste the JD manually.",
    };
  }

  return { ok: true, text };
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * SSRF guard. Blocks loopback, link-local, and the standard private
 * IPv4/IPv6 ranges. Not a perfect defense (no DNS-rebinding mitigation),
 * but enough for a personal tool gated by a cookie.
 */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "ip6-localhost" || h === "ip6-loopback") {
    return true;
  }
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) {
    return true;
  }
  return false;
}
