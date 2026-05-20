// SERVER-ONLY: cross-reference critic for resume drafts.
// Goes through the `judge` role in src/lib/ai for the underlying call,
// which currently chains to Groq + Llama 3.3 70B. Returns CheckIssue[]
// so the same retry loop handles judge findings and heuristic ones.
// Errors / disabled / timeouts return [] silently — judge is additive.
//
// Swap the provider by editing `chainFor("judge")` in src/lib/ai/roles.ts
// or by setting AI_JUDGE_CHAIN=openrouter,groq in env.

import { tryRole } from "@/lib/ai";
import { buildCorpus } from "./prompt";
import type { CheckIssue } from "./checks";

const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are a senior technical recruiter and engineering hiring manager critiquing a resume draft. You have:
- The candidate's complete, honest body of work (PUBLIC SITE + EXTENDED CORPUS sections). Anything not in the corpus is potentially fabricated.
- The job description (JD) the resume is targeting.
- The draft resume (Markdown).

Your job: find SPECIFIC, ACTIONABLE issues that would hurt this resume in any of three filters:
  (a) an ATS scoring tool comparing the resume to the JD,
  (b) an AI screener (LLM-based) evaluating fit and writing quality,
  (c) a human recruiter doing a 20-30 second skim and a hiring manager doing a deeper read.

YOUR INSPECTION PROCESS — do this in order before writing any issues:

  STEP 1. CROSS-REFERENCE PASS. Go through the draft bullet by bullet. For each bullet, locate the corpus entry it derives from. Confirm:
    - Every NUMBER in the bullet appears verbatim in that corpus entry (e.g., "23 scrapers", "10,000+ recipients", "19-model schema"). Numbers not in the corpus are fabrications.
    - Every TECHNOLOGY listed (frameworks, languages, services, databases) appears in that corpus entry. A bullet that names a tool not in the corpus is a fabrication.
    - The DATE STRING matches the corpus exactly (month + year on both ends, same separator). "Apr 2025 - Present" must stay "Apr 2025 - Present", not "2024 - Present" or "Spring 2025".
    - The JOB TITLE matches the corpus exactly. "Founder & Engineer" must not become "Lead Engineer" or "Founding Engineer".
    - The SCOPE claim is supported. A bullet claiming "shipped to 10,000 users" must trace to a corpus line that supports 10,000 users.

  STEP 2. JD ALIGNMENT PASS. For each meaningful skill/technology/methodology in the JD:
    - Is it present in the resume? If the corpus shows the candidate honestly has it AND the JD calls it out AND the draft omits it, that's a missed keyword.
    - Is the JD's exact phrasing used? ("Node.js" vs "NodeJS"; "PostgreSQL" vs "Postgres".)

  STEP 3. VOICE PASS. Read each section. Flag bullets that read like LLM output specifically (filler adjectives, parallel verb-noun-outcome sentences in a row, vague generic nouns where the corpus has specific named systems).

Categories of issues:
  - FABRICATION: a claim, number, technology, or scope assertion in the draft is NOT supported by the corpus. Quote the offending line. THIS IS THE HIGHEST-PRIORITY CHECK.
  - DATE MISMATCH: a date string in the draft differs from the corpus's date string for the same role/project. Always hard. Quote both.
  - TITLE MISMATCH: a job title or project name in the draft differs from the corpus's exact wording. Always hard. Quote both.
  - QUANTITATIVE CLAIM UNSUPPORTED: a specific number/percentage/scale in the draft has no corpus support. Hard if it inflates impact (e.g. "10x faster"); soft if it's a vague approximation.
  - CREDENTIAL OVERSTATEMENT: words like "senior", "lead", "staff", "principal", "expert" describing the candidate. He is a 2026 new grad — these are almost always wrong. The ONLY exempt place is the role line directly under "# NATE WHITE" when that line is the JD's verbatim job title (e.g., the JD says "Senior Backend Engineer" so the role line reads "Senior Backend Engineer | …"). "CS senior" is a particularly common slip and is always hard. Quote verbatim.
  - WEAK BULLET: bullets missing action + method + measurable outcome (or honest concrete scope marker). Vague verbs ("worked on", "helped with", "contributed to") and generic nouns ("various systems", "key initiatives") qualify. Quote the offending line.
  - UNDERSELLING: a corpus entry has a strong, quantified achievement that the draft mentions but flattens into a vague version. Worth pointing out so the candidate can restore the specific.
  - AI VOICE: filler adjectives ("robust", "scalable", "performant"), tricolons used heavily, uniform verb-noun-outcome rhythm across an experience block, or canned phrases that make the resume read as machine-generated.
  - MISSING KEYWORD: a skill/technology/framework the JD emphasizes AND the corpus shows the candidate has, but the draft omits.
  - TONE MISMATCH: register or framing that fits the wrong kind of role (e.g., academic-flavored bullet on a startup-shipping role).

Severity rubric:
  - "hard": would meaningfully reduce interview odds (fabrication, date/title mismatch, credential overstatement, missed obvious JD-keyword, ≥2 weak bullets in a single role).
  - "soft": worth noting but not a deal-breaker.

Output a single JSON object (and NOTHING ELSE):

{
  "issues": [
    {
      "severity": "hard" | "soft",
      "category": "Fabrication" | "Date mismatch" | "Title mismatch" | "Quantitative claim unsupported" | "Credential overstatement" | "Weak bullet" | "Underselling" | "AI voice" | "Missing keyword" | "Tone mismatch",
      "message": "<one-sentence summary>",
      "detail": "<exact quote from the draft, OR for missing keyword/underselling: the specific phrase that should be added or restored from the corpus>"
    },
    ...
  ]
}

If the draft is clean, return: {"issues": []}.

Rules:
- Maximum 12 issues. Prioritize by severity. Don't pad.
- Be CONCRETE. Quote actual lines from the draft in \`detail\`. Don't say "some bullets are weak"; quote the offending bullet verbatim.
- For Fabrication / Date mismatch / Title mismatch / Quantitative claim unsupported: ALWAYS quote BOTH the draft line AND the corpus line it conflicts with (or "<not in corpus>" if it has no corpus basis).
- Don't critique the contact line, section headers, or META block — those are checked elsewhere.
- Don't make up issues; if nothing is wrong, return an empty array. A "{ issues: [] }" response is fine and expected for clean drafts.`;

export async function judgeResume(input: {
  jobDescription: string;
  markdown: string;
}): Promise<CheckIssue[]> {
  const corpus = buildCorpus();
  const slimCorpus = {
    // Project deep-dives bloat the public-site corpus to ~40KB. Free-tier
    // judge providers often cap single-request input at 12K tokens, so
    // we strip the deep-dive section. Fabrication detection still works
    // because project cards (titles, dates, tech, descriptions) and the
    // extended corpus carry the verifiable facts.
    publicSite: stripDeepDives(corpus.publicSite),
    extended: corpus.extended,
  };
  const userMessage = buildUserMessage(
    slimCorpus,
    input.jobDescription,
    input.markdown,
  );

  let raw: string;
  try {
    const result = await tryRole("judge", (provider) =>
      provider.generate({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: userMessage,
        // JSON mode pins the output to a single JSON object, no prose
        // around it. Cuts parsing failures to ~zero on Llama 3.3 70B
        // and the equivalent OpenAI/OpenRouter free-tier models.
        responseFormat: "json",
        temperature: 0.3,
        // 3072 gives the model room to emit up to 12 issues with
        // verbatim quotes (fabrication / date / title pairs need both
        // the draft line AND the corpus line).
        maxOutputTokens: 3072,
        timeoutMs: TIMEOUT_MS,
      }),
    );
    raw = result.text;
  } catch (err) {
    console.warn(
      `[judge] provider chain exhausted: ${(err as Error).message ?? "unknown"}`,
    );
    return [];
  }

  const parsed = safeParseJson(raw);
  if (!parsed) {
    console.warn("[judge] response was not valid JSON.");
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
  "Date mismatch",
  "Title mismatch",
  "Quantitative claim unsupported",
  "Credential overstatement",
  "Weak bullet",
  "Underselling",
  "AI voice",
  "Missing keyword",
  "Tone mismatch",
]);

function normalizeIssues(parsed: unknown): CheckIssue[] {
  if (!parsed || typeof parsed !== "object") return [];
  const issuesRaw = (parsed as { issues?: unknown }).issues;
  if (!Array.isArray(issuesRaw)) return [];

  const out: CheckIssue[] = [];
  for (let i = 0; i < Math.min(issuesRaw.length, 12); i++) {
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
