// SERVER-ONLY: ATS keyword extraction + resume cross-reference.
//
// Two jobs:
//   1. extractAtsKeywords(jdText) — one LLM call that pulls the 12-20
//      keywords an ATS would scan a resume for, ranked by importance.
//   2. analyzeAgainstResume(keywords) — flags which of those keywords are
//      NOT already present in RESUME_TEXT, so Nate knows what to weave in.
//
// Never import from a client component (uses the AI provider abstraction
// and reads server-side data).

import { tryRole, ProviderError } from "@/lib/ai";
import { RESUME_TEXT } from "@/data/resume-text";

export type KeywordHit = {
  /** The keyword, verbatim from the model. */
  term: string;
  /** True if the term already appears in the resume. */
  inResume: boolean;
};

const SYSTEM_PROMPT = `You extract ATS keywords from a job description. An applicant tracking system (ATS) scans resumes for specific terms from the JD; your job is to surface the ones that matter most so the applicant can make sure their resume includes them.

Output ONLY a JSON array of strings — no prose, no markdown fences. Example: ["Python","REST APIs","CI/CD","Kubernetes"]

Rules:
- 12 to 20 keywords, ordered MOST important first.
- Pull hard skills, technologies, languages, frameworks, tools, platforms, methodologies, certifications, and role-specific nouns (e.g. "distributed systems", "manufacturing automation").
- Use the JD's own phrasing. If the JD says "C#", output "C#", not "CSharp".
- Prefer specific over generic: "PostgreSQL" over "databases" when the JD names it.
- EXCLUDE generic soft skills and filler ("communication", "team player", "fast-paced", "detail-oriented").
- No duplicates, no near-duplicates (pick one of "JS"/"JavaScript").
- First character of your output must be [ and the last must be ].`;

/**
 * Extract ranked ATS keywords from JD text. Returns [] on failure
 * (never throws) so the route can respond gracefully.
 */
export async function extractAtsKeywords(jdText: string): Promise<string[]> {
  const trimmed = jdText.trim();
  if (trimmed.length < 50) return [];

  try {
    const result = await tryRole("ats-keywords", (provider) =>
      provider.generate({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Extract the ATS keywords from this job description.\n\n<job-description>\n${trimmed}\n</job-description>\n\nReturn a JSON array of strings only.`,
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseFormat: "json",
        timeoutMs: 30_000,
      }),
    );
    return parseKeywordArray(result.text);
  } catch (err) {
    const msg =
      err instanceof ProviderError ? `${err.kind}: ${err.message}` : String(err);
    console.warn("[ats-keywords] extraction failed:", msg);
    return [];
  }
}

/** Parse the model's JSON array output. Permissive; returns [] on garbage. */
export function parseKeywordArray(raw: string): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: maybe a newline/comma list rather than JSON.
    return cleaned
      .split(/[\n,]+/)
      .map((s) => s.replace(/^[\s"'\-*]+|[\s"']+$/g, "").trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of parsed) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, 20);
}

/**
 * Flag which keywords already appear in the resume. Matching is
 * punctuation-normalized and whole-word/phrase aware, so "C++" matches
 * "C++", "Java" does NOT match "JavaScript", and "Spring Boot" only
 * matches the full phrase.
 */
export function analyzeAgainstResume(keywords: string[]): KeywordHit[] {
  const resumeNorm = ` ${normalizeForMatch(RESUME_TEXT)} `;
  return keywords.map((term) => {
    const nk = normalizeForMatch(term);
    const inResume = nk.length > 0 && resumeNorm.includes(` ${nk} `);
    return { term, inResume };
  });
}

/**
 * Normalize text for keyword matching:
 *   C++  -> "cpp",  C#  -> "csharp",  .NET -> "net",  Node.js -> "node js"
 * then strip remaining punctuation and collapse whitespace. The result is
 * a space-delimited token stream; callers pad with spaces and use
 * includes(" term ") for whole-word / phrase matching.
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+\+/g, "pp") // c++ -> cpp
    .replace(/#/g, "sharp") // c# -> csharp
    .replace(/\./g, " ") // .net -> " net", node.js -> "node js"
    .replace(/[^a-z0-9 ]+/g, " ") // drop other punctuation
    .replace(/\s+/g, " ")
    .trim();
}
