// POST /api/resume/fetch-jd
//
// Pulls the visible text from a job-posting URL so the user doesn't have
// to copy-paste a whole posting into the JD textarea.
//
// Auth: same resume_session cookie as POST /api/resume. Without it the
//       endpoint 401s, so it can't be used as a free proxy by anyone who
//       finds the URL.
//
// Request:  { url: string }
// Response: { text: string } on success, { error: string } otherwise.
//
// Caveats: works on static HTML postings (Greenhouse, Lever, most company
// careers pages). Will return very little useful text for JS-rendered
// pages (Workday's iframe-heavy postings, LinkedIn jobs behind auth).
// In those cases the user is expected to fall back to copy-paste.

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2_000_000; // 2 MB cap on fetched HTML
const MAX_TEXT_LEN = 12_000; // matches the JD length cap on /api/resume

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) {
    return jsonError(401, "Unauthorized.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }
  const url = (body as { url?: unknown })?.url;
  if (typeof url !== "string" || !url.trim()) {
    return jsonError(400, "Body must include a `url` string.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return jsonError(400, "That doesn't look like a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return jsonError(400, "URL must use http or https.");
  }
  if (isPrivateHost(parsed.hostname)) {
    return jsonError(
      400,
      "Refusing to fetch private/internal hosts.",
    );
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
        // Realistic browser UA. Some job boards return stripped-down HTML
        // to generic fetcher UAs.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = (err as Error).name === "AbortError"
      ? `Timed out fetching the page after ${FETCH_TIMEOUT_MS / 1000}s.`
      : `Could not fetch URL: ${(err as Error).message}`;
    return jsonError(502, msg);
  }
  clearTimeout(timer);

  if (!res.ok) {
    return jsonError(
      502,
      `Page returned HTTP ${res.status}. Try copy-pasting the JD instead.`,
    );
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml/i.test(ct)) {
    return jsonError(
      415,
      `URL returned non-HTML content (${ct || "unknown"}). Paste the JD manually.`,
    );
  }

  // Read up to MAX_HTML_BYTES. Stops short of the size cap if the body
  // is smaller; bails with an error if it's larger.
  const reader = res.body?.getReader();
  if (!reader) return jsonError(502, "Empty response body.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        return jsonError(
          413,
          `Page is larger than ${MAX_HTML_BYTES / 1_000_000}MB. Paste the JD manually.`,
        );
      }
      chunks.push(value);
    }
  } catch (err) {
    return jsonError(
      502,
      `Failed reading page body: ${(err as Error).message}`,
    );
  }

  const html = new TextDecoder("utf-8").decode(concat(chunks));
  const text = htmlToText(html).slice(0, MAX_TEXT_LEN);
  if (text.length < 100) {
    return jsonError(
      422,
      "Could not extract enough text from the page. It may be JS-rendered (e.g. Workday). Paste the JD manually.",
    );
  }

  return new Response(JSON.stringify({ text }), {
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
  // .local / .internal-style names.
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv4 dotted quads.
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
  // IPv6 loopback / unique-local / link-local.
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) {
    return true;
  }
  return false;
}

/**
 * Cheap HTML → plain text. Strips script/style/svg blocks, removes
 * comments and remaining tags, decodes the common entities, and
 * collapses whitespace. Adequate for static job-posting HTML.
 */
function htmlToText(html: string): string {
  let text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");

  // Comments.
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Preserve line breaks where the HTML had block boundaries.
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|article|section|ul|ol)>/gi, "\n");

  // Strip remaining tags.
  text = text.replace(/<[^>]+>/g, "");

  // Decode the entities that show up in nearly every page.
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => safeFromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      safeFromCodePoint(parseInt(n, 16)),
    );

  // Collapse whitespace: many spaces/tabs to one, many blank lines to one.
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function safeFromCodePoint(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return "";
  try {
    return String.fromCodePoint(n);
  } catch {
    return "";
  }
}
