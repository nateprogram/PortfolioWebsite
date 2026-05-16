// SERVER-ONLY: cross-reference critic for resume drafts.
//
// Hits Groq's OpenAI-compatible endpoint with Llama 3.3 70B Versatile
// as a second-opinion model. Different family from Gemini (Meta vs.
// Google), so it catches blind spots Gemini's self-evaluation misses:
//   - Claims/numbers not supported by Nate's corpus (fabrication)
//   - Bullets that lack action + method + measurable outcome
//   - AI-tells in voice (filler verbs, parallel construction) the
//     regex checks didn't flag
//   - JD keywords Nate honestly has but the draft omitted
//   - Tone / register mismatches with the JD
//
// Returns a list of CheckIssue objects compatible with the heuristic
// check library, so the same auto-retry loop can act on them.
//
// Failure modes (network, 429, malformed JSON) return an empty array
// silently — the heuristic checks remain authoritative; the judge is
// additive signal. Surface the actual error in the server log only.

import { buildCorpus } from "./resume-prompt";
import type { CheckIssue } from "./resume-checks";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are a senior technical recruiter and engineering hiring manager critiquing a resume draft. You have:
- The candidate's complete, honest body of work (PUBLIC SITE + EXTENDED CORPUS sections). Anything not in the corpus is potentially fabricated.
- The job description (JD) the resume is targeting.
- The draft resume (Markdown).

Your job: find SPECIFIC, ACTIONABLE issues that would hurt this resume in either of three places:
  (a) an ATS scoring tool comparing the resume to the JD,
  (b) an AI screener (LLM-based) evaluating fit and writing quality,
  (c) a human recruiter doing a 20-30 second skim and a hiring manager doing a deeper read.

Categories of issues you must look for:
  - FABRICATION: claims, numbers, technologies, or scope assertions in the draft that are NOT supported by the corpus. Be precise — quote the offending bullet.
  - WEAK BULLET: bullets missing action + method + measurable outcome (or honest concrete scope marker). Vague verbs like "worked on", "helped with", "contributed to" qualify. Bullets with no specific noun or no result qualify.
  - AI VOICE: filler adjectives ("robust", "scalable", "performant"), tricolons used heavily, uniform parallel construction across an experience block, or the canned phrases that make resumes read as machine-generated.
  - MISSING KEYWORD: a skill, technology, or framework that the JD emphasizes AND the candidate's corpus shows they honestly have, but the draft omits.
  - TONE MISMATCH: register or framing that fits the wrong kind of role (e.g., an academic-flavored bullet on a startup-shipping role).

Severity rubric:
  - "hard": would meaningfully reduce interview odds (fabrication, multiple weak bullets, missed obvious JD-keyword the candidate has)
  - "soft": worth noting but not a deal-breaker

Output a single JSON object (and NOTHING ELSE):

{
  "issues": [
    {
      "severity": "hard" | "soft",
      "category": "Fabrication" | "Weak bullet" | "AI voice" | "Missing keyword" | "Tone mismatch",
      "message": "<one-sentence summary>",
      "detail": "<exact quote from the draft, OR the specific keyword that should be added>"
    },
    ...
  ]
}

If the draft is clean, return: {"issues": []}.

Rules:
- Maximum 8 issues. Prioritize. Don't pad.
- Be CONCRETE. Quote actual lines from the draft in \`detail\`. Don't say "some bullets are weak"; say "the bullet 'Worked on the CI pipeline' lacks an outcome".
- Don't critique the contact line, section headers, or META block — those are checked elsewhere.
- Don't make up issues; if nothing is wrong, return an empty array.`;

export async function judgeResume(input: {
  jobDescription: string;
  markdown: string;
}): Promise<CheckIssue[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[judge] GROQ_API_KEY missing; skipping judge pass.");
    return [];
  }

  const corpus = buildCorpus();
  const slimCorpus = {
    // Project deep-dives bloat the public-site corpus to ~40KB. Groq's
    // free tier caps single-request input at 12K tokens (TPM=12000),
    // so we strip the deep-dive section. Fabrication detection still
    // works because project cards (titles, dates, tech, descriptions)
    // and the extended corpus carry the verifiable facts.
    publicSite: stripDeepDives(corpus.publicSite),
    extended: corpus.extended,
  };
  const userMessage = buildUserMessage(slimCorpus, input.jobDescription, input.markdown);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        // JSON mode pins the output to a single JSON object, no prose
        // around it. Cuts parsing failures to ~zero on Llama 3.3 70B.
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2048,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    console.warn(
      `[judge] Groq call failed: ${(err as Error).message ?? "unknown"}`,
    );
    return [];
  }
  clearTimeout(timer);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(
      `[judge] Groq returned ${res.status}: ${body.slice(0, 200)}`,
    );
    return [];
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    console.warn("[judge] Groq response was not JSON.");
    return [];
  }

  const content = extractMessageContent(json);
  if (!content) return [];

  const parsed = safeParseJson(content);
  if (!parsed) {
    console.warn("[judge] Groq content was not valid JSON.");
    return [];
  }

  return normalizeIssues(parsed);
}

// ----- helpers --------------------------------------------------------------

/**
 * Drop everything from the "PROJECT DEEP-DIVES" marker onward in the
 * corpus's public-site string. The project cards section (titles, dates,
 * tech stacks, descriptions) above it is enough for fabrication checks;
 * the deep-dive prose below it is ~25KB that would push the request
 * over Groq's 12K-token free-tier TPM limit.
 */
function stripDeepDives(publicSite: string): string {
  const marker = "PROJECT DEEP-DIVES";
  const idx = publicSite.indexOf(marker);
  if (idx === -1) return publicSite;
  return publicSite.slice(0, idx).trimEnd();
}


function buildUserMessage(
  corpus: { publicSite: string; extended: string },
  jobDescription: string,
  markdown: string,
): string {
  return `# CANDIDATE CORPUS (public site)

${corpus.publicSite}

# CANDIDATE CORPUS (extended / private)

${corpus.extended}

# JOB DESCRIPTION

${jobDescription.trim()}

# DRAFT RESUME (under review)

${markdown}

Critique the DRAFT RESUME against the corpus and the JD. Output only the JSON object specified in the system prompt.`;
}

function extractMessageContent(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const choices = (raw as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { message?: { content?: unknown } };
  const content = first?.message?.content;
  return typeof content === "string" ? content : null;
}

function safeParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    // Some models wrap JSON in ```json``` fences despite JSON-mode; strip.
    const stripped = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    try {
      return JSON.parse(stripped);
    } catch {
      return null;
    }
  }
}

const ALLOWED_CATEGORIES = new Set([
  "Fabrication",
  "Weak bullet",
  "AI voice",
  "Missing keyword",
  "Tone mismatch",
]);

function normalizeIssues(parsed: unknown): CheckIssue[] {
  if (!parsed || typeof parsed !== "object") return [];
  const issuesRaw = (parsed as { issues?: unknown }).issues;
  if (!Array.isArray(issuesRaw)) return [];

  const out: CheckIssue[] = [];
  for (let i = 0; i < Math.min(issuesRaw.length, 8); i++) {
    const item = issuesRaw[i] as {
      severity?: unknown;
      category?: unknown;
      message?: unknown;
      detail?: unknown;
    };
    const severity =
      item.severity === "hard" || item.severity === "soft" ? item.severity : "soft";
    const category =
      typeof item.category === "string" && ALLOWED_CATEGORIES.has(item.category)
        ? item.category
        : "Judge note";
    const message =
      typeof item.message === "string" && item.message.trim()
        ? item.message.trim()
        : null;
    if (!message) continue;
    const detail =
      typeof item.detail === "string" && item.detail.trim()
        ? item.detail.trim().slice(0, 240)
        : undefined;
    out.push({
      id: `judge:${category.toLowerCase().replace(/\s+/g, "_")}:${i}`,
      severity,
      category,
      message,
      detail,
    });
  }
  return out;
}
