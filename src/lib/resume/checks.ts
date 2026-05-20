// Heuristic quality checks for resume output. Pure JS — runs in the
// Next.js client, in tests, and could run server-side if we ever want
// pre-stream gating. Returns a structured CheckResult; `retryNotes` is
// pre-formatted for pasting into the model's fix-feedback prompt.

export type CheckSeverity = "hard" | "soft";

export type CheckIssue = {
  /** Stable identifier — used for de-duplication and analytics. */
  id: string;
  severity: CheckSeverity;
  /** Short category label (shown in UI badges, console output). */
  category: string;
  /** One-line human-readable summary. */
  message: string;
  /** Optional offending fragment(s) to show the user. */
  detail?: string;
};

export type CheckResult = {
  /** True iff there are zero hard failures. Soft fails are still OK to ship. */
  passed: boolean;
  hardFails: CheckIssue[];
  softFails: CheckIssue[];
  /**
   * Plain-text instruction block describing what to fix, ready to paste
   * into a retry prompt to the model. Empty string if `passed` is true.
   */
  retryNotes: string;
};

// ----- check definitions ----------------------------------------------------

const BANLIST = [
  // The three stickiest LLM-resume tells. Promoted to dedicated rules in
  // the SYSTEM_PROMPT; still listed here so they are caught if a
  // retry/judge slips them through.
  "ensure", "ensuring", "end-to-end", "standardize", "standardized",
  // Adjective fluff
  "leverage", "robust", "comprehensive", "cutting-edge", "innovative",
  "passionate", "seamless", "intricate", "myriad", "performant",
  "transformative", "game-changing", "revolutionary", "pivotal", "vibrant",
  // Travel / journey metaphors
  "dive deep", "delve", "delving", "navigating",
  "tapestry", "unleash",
  // Hype verbs
  "spearhead", "spearheaded", "orchestrate", "orchestrated",
  "foster", "fostered", "empower", "empowered",
  "streamline", "streamlined", "elevate", "elevated", "enhanced",
  "modernize", "championed",
  "facilitate", "facilitated",
  "demonstrate", "demonstrating", "showcase", "showcasing",
  "architected", "utilize", "utilizing",
  // Resume cliches
  "results-driven", "detail-oriented", "self-motivated", "self-starter",
  "team player", "go-getter", "highly motivated", "hardworking",
  // Corporate filler
  "synergy", "best-in-class", "cross-functional",
  "production-shaped",
  // Connective tells
  "notably", "crucially", "furthermore", "moreover",
  // Soft hedges
  "significantly", "substantially", "considerably",
  // Passive constructions
  "worked on", "helped with", "responsible for", "assisted with",
  "participated in", "duties included",
];

const REQUIRED_SECTIONS = ["Education", "Skills", "Experience", "Projects"];
const ALLOWED_SECTIONS = new Set([
  "ATS Keywords",
  "Summary",
  ...REQUIRED_SECTIONS,
]);

// ----- main entry point -----------------------------------------------------

export function checkResume(markdown: string): CheckResult {
  const issues: CheckIssue[] = [];

  if (!markdown || markdown.length < 500) {
    issues.push({
      id: "length:too-short",
      severity: "hard",
      category: "Output truncated",
      message: `Output is only ${markdown.length} characters; expected 2000+.`,
      detail: "Likely a streaming-side cutoff. Retry usually fixes this.",
    });
    return finalize(issues);
  }

  checkMetaBlock(markdown, issues);
  checkBanlist(markdown, issues);
  checkDashes(markdown, issues);
  checkSeparators(markdown, issues);
  checkPhoneFormat(markdown, issues);
  checkSections(markdown, issues);
  checkTricolons(markdown, issues);
  checkBulletOpeners(markdown, issues);
  checkBulletLengthVariance(markdown, issues);
  checkBulletCount(markdown, issues);
  checkRhythm(markdown, issues);

  return finalize(issues);
}

function finalize(issues: CheckIssue[]): CheckResult {
  const hardFails = issues.filter((i) => i.severity === "hard");
  const softFails = issues.filter((i) => i.severity === "soft");
  const passed = hardFails.length === 0;
  const retryNotes = passed
    ? ""
    : hardFails
        .map((i, idx) => {
          const head = `${idx + 1}. [${i.category}] ${i.message}`;
          return i.detail ? `${head}\n   detail: ${i.detail}` : head;
        })
        .join("\n");
  return { passed, hardFails, softFails, retryNotes };
}

// ----- individual checks ----------------------------------------------------

function checkMetaBlock(md: string, out: CheckIssue[]) {
  if (!/\[META\][\s\S]*?\[\/META\]/.test(md)) {
    out.push({
      id: "meta:missing",
      severity: "hard",
      category: "META block",
      message: "Missing [META]...[/META] block at the top of the output.",
      detail:
        "The block must contain `company:` and `position:` lines so the download tool can build a smart filename.",
    });
  }
}

function checkBanlist(md: string, out: CheckIssue[]) {
  for (const word of BANLIST) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    const m = re.exec(md);
    if (m) {
      out.push({
        id: `banlist:${word.replace(/\s+/g, "_")}`,
        severity: "hard",
        category: "Banned word",
        message: `"${m[0]}" is on the AI-tell banlist.`,
        detail: extractContext(md, m.index, 60),
      });
    }
  }
}

function checkDashes(md: string, out: CheckIssue[]) {
  const em = (md.match(/—/g) || []).length;
  const en = (md.match(/–/g) || []).length;
  if (em > 0) {
    out.push({
      id: "dashes:em",
      severity: "hard",
      category: "Em dashes",
      message: `Found ${em} em dash${em === 1 ? "" : "es"} (—).`,
      detail: "Replace with colons, periods, semicolons, or commas.",
    });
  }
  if (en > 0) {
    out.push({
      id: "dashes:en",
      severity: "hard",
      category: "En dashes",
      message: `Found ${en} en dash${en === 1 ? "" : "es"} (–).`,
      detail: "Replace with a plain hyphen `-`.",
    });
  }
}

function checkSeparators(md: string, out: CheckIssue[]) {
  const dots = (md.match(/·/g) || []).length;
  if (dots > 0) {
    out.push({
      id: "sep:middle-dot",
      severity: "hard",
      category: "Wrong separator",
      message: `Found ${dots} middle-dot (·) separator${dots === 1 ? "" : "s"}.`,
      detail: "Use ` | ` (pipe with spaces) instead.",
    });
  }
}

function checkPhoneFormat(md: string, out: CheckIssue[]) {
  // If the canonical `(xxx) xxx-xxxx` shape appears anywhere in the
  // output, we're good — the contact line has it. (Word boundaries
  // around `(` are tricky, so do a substring search.)
  if (/\(\d{3}\)\s\d{3}-\d{4}/.test(md)) return;
  // Otherwise, look for any phone-shaped string at all and flag.
  const candidates = md.match(/\(?\d{3}\)?[^\d\n]{1,3}\d{3}[^\d\n]{1,3}\d{4}/g);
  if (candidates && candidates.length > 0) {
    out.push({
      id: "phone:format",
      severity: "hard",
      category: "Phone format",
      message: `Phone number not in (xxx) xxx-xxxx format.`,
      detail: `Found: ${candidates.join(", ")}.`,
    });
  }
}

function checkSections(md: string, out: CheckIssue[]) {
  for (const name of REQUIRED_SECTIONS) {
    const re = new RegExp(`^##\\s+${name}\\s*$`, "m");
    if (!re.test(md)) {
      out.push({
        id: `section:missing:${name}`,
        severity: "hard",
        category: "Missing section",
        message: `Required section "${name}" is missing.`,
      });
    }
  }
  const customHeadings = [...md.matchAll(/^##\s+([^\n]+)$/gm)]
    .map((m) => m[1].trim())
    .filter((h) => !ALLOWED_SECTIONS.has(h));
  if (customHeadings.length > 0) {
    out.push({
      id: "section:custom",
      severity: "hard",
      category: "Non-standard section",
      message: `Non-standard section heading(s): ${customHeadings.join(", ")}.`,
      detail:
        "Use only: Summary (optional), Education, Skills, Experience, Projects. ATS Keywords is allowed above the `---` divider.",
    });
  }
}

function checkTricolons(md: string, out: CheckIssue[]) {
  // Pattern: "word, word, and word" inside bullet/sentence prose. Skip
  // the ATS Keywords list (one-keyword-per-bullet). Tricolons are an
  // AI-detector signal but the model legitimately produces 3-item
  // factual lists (web/iOS/Android, SQLite/Redis/Parquet) that read
  // worse when forcibly restructured. Treat as a soft warning unless
  // they get egregious (5+), since a resume packed with tricolons
  // really does read as LLM-generated.
  const body = stripAtsKeywordsSection(md);
  const matches = body.match(/\w+,\s+[\w\s]+,\s+and\s+\w+/g) || [];
  if (matches.length === 0) return;
  if (matches.length >= 5) {
    out.push({
      id: "tricolon:excessive",
      severity: "hard",
      category: "Tricolons",
      message: `Found ${matches.length} "X, Y, and Z" patterns (5+ is an AI-detector tell).`,
      detail: matches.slice(0, 4).join(" | "),
    });
    return;
  }
  out.push({
    id: matches.length === 1 ? "tricolon:one" : "tricolon:few",
    severity: "soft",
    category: "Tricolon",
    message:
      matches.length === 1
        ? `One "X, Y, and Z" pattern.`
        : `${matches.length} "X, Y, and Z" patterns (consider restructuring).`,
    detail: matches.slice(0, 4).join(" | "),
  });
}

function checkBulletOpeners(md: string, out: CheckIssue[]) {
  const firstWords = [...md.matchAll(/^[-*]\s+(\w+)/gm)].map((m) =>
    m[1].toLowerCase(),
  );
  if (firstWords.length === 0) return;
  const counts: Record<string, number> = {};
  for (const w of firstWords) counts[w] = (counts[w] ?? 0) + 1;
  const offenders = Object.entries(counts)
    .filter(([w, n]) => n >= 3 && !isAtsKeywordOpener(w))
    .sort((a, b) => b[1] - a[1]);
  if (offenders.length === 0) return;
  out.push({
    id: "openers:repeated",
    severity: "hard",
    category: "Bullet-opener repetition",
    message: `These verbs start 3+ bullets: ${offenders
      .map(([w, n]) => `${w}×${n}`)
      .join(", ")}.`,
    detail: "Rule E caps any opener at 2. Use the action-verb whitelist.",
  });
}

function checkBulletLengthVariance(md: string, out: CheckIssue[]) {
  // Only run on the prose bullets, not the ATS Keywords list.
  const body = stripAtsKeywordsSection(md);
  const wordCounts = [...body.matchAll(/^[-*]\s+(.+)$/gm)]
    .map((m) => m[1].split(/\s+/).filter(Boolean).length)
    .filter((n) => n >= 3); // skip degenerate single-word bullets
  if (wordCounts.length < 6) return;
  const avg = wordCounts.reduce((s, n) => s + n, 0) / wordCounts.length;
  const variance =
    wordCounts.reduce((s, n) => s + (n - avg) ** 2, 0) / wordCounts.length;
  const stddev = Math.sqrt(variance);
  if (stddev < 2.5) {
    out.push({
      id: "bullets:uniform",
      severity: "hard",
      category: "Uniform bullet length",
      message: `Bullets are too uniform in length (stddev ${stddev.toFixed(
        1,
      )} words; should be ≥ 2.5).`,
      detail: "Mix one short bullet (≤12 words) with longer ones (15-25 words).",
    });
  }
}

function checkBulletCount(md: string, out: CheckIssue[]) {
  const body = stripAtsKeywordsSection(md);
  const bullets = (body.match(/^[-*]\s+\S/gm) || []).length;
  if (bullets > 0 && bullets < 12) {
    out.push({
      id: "bullets:few",
      severity: "soft",
      category: "Bullet count",
      message: `Only ${bullets} bullets total. Target is 15-25.`,
    });
  } else if (bullets > 28) {
    out.push({
      id: "bullets:many",
      severity: "soft",
      category: "Bullet count",
      message: `${bullets} bullets total. Aim for 15-25 to keep to one page.`,
    });
  }
}

/**
 * Structural rhythm check. Approximates what modern AI detectors
 * (GPTZero, Originality.ai, the 2025 stylometric-Random-Forest paper)
 * actually compute beyond vocabulary. Looks at four things:
 *
 *   1. Burstiness — Fano factor on sentence lengths. Humans cluster
 *      around variance/mean ≥ 0.6; LLMs around 0.2-0.4. Threshold 0.3.
 *   2. Em-dash density — em-dashes per 100 words. Resumes shouldn't
 *      have any; > 2/100 reads as machine-styled prose.
 *   3. Consecutive equal-length sentences — three or more sentences in
 *      a row within ±2 tokens of each other. Rare in human writing.
 *   4. AI-phrase density — over-represented LLM phrases beyond the
 *      banlist that escape the per-word regex check.
 *
 * Thresholds and feature list from §2.4 and §2.8 of the May-2026
 * research report. Most produce SOFT warnings since real human resumes
 * also score in this range on detectors; only the worst patterns hard-fail.
 */
function checkRhythm(md: string, out: CheckIssue[]) {
  const body = stripAtsKeywordsSection(md);

  // 1. Em-dash density (already a hard fail via checkDashes; here we
  //    additionally watch for any unicode-dash variants the dash check
  //    misses — figure dash, horizontal bar, etc.).
  const otherDashes = (body.match(/[‐‒–—―]/g) ?? [])
    .length;
  const wordCount = (body.match(/\S+/g) ?? []).length;
  if (wordCount > 0) {
    const density = otherDashes / (wordCount / 100);
    if (density > 2) {
      out.push({
        id: "rhythm:dash-density",
        severity: "soft",
        category: "Rhythm",
        message: `${otherDashes} unicode dashes across ${wordCount} words (≈ ${density.toFixed(1)} per 100). LLM tell.`,
      });
    }
  }

  // 2. Consecutive equal-length sentences. Pull sentences from prose
  //    only (skip bullet content since bullets are intentionally tight).
  const proseSentences = body
    .split(/\n+/)
    .filter((line) => !/^[-*]\s/.test(line.trim()) && line.trim().length > 0)
    .flatMap((line) =>
      line.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean),
    );
  const sentenceLengths = proseSentences.map(
    (s) => (s.match(/\S+/g) ?? []).length,
  );
  let maxRun = 1;
  let currentRun = 1;
  for (let i = 1; i < sentenceLengths.length; i++) {
    if (Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]) <= 2) {
      currentRun++;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 1;
    }
  }
  if (maxRun >= 3 && sentenceLengths.length >= 5) {
    out.push({
      id: "rhythm:consecutive-equal-length",
      severity: "soft",
      category: "Rhythm",
      message: `${maxRun} consecutive sentences within ±2 words of each other. Vary sentence shape.`,
    });
  }

  // 3. AI-phrase density. Bigrams + trigrams over-represented in LLM
  //    output that single-word banlist misses. Not exhaustive — extend
  //    based on observed leaks.
  const AI_PHRASES = [
    "in the realm of",
    "in the world of",
    "in today's",
    "delve into",
    "navigate the landscape",
    "in conclusion",
    "to summarize",
    "in summary",
    "it is worth noting",
    "it should be noted",
    "play a pivotal role",
    "a testament to",
    "rich tapestry",
    "ever-evolving",
    "ever-changing",
    "the intersection of",
    "at the forefront",
    "wealth of experience",
    "passion for",
    "deep understanding",
  ];
  const phraseHits: string[] = [];
  const lower = body.toLowerCase();
  for (const phrase of AI_PHRASES) {
    if (lower.includes(phrase)) phraseHits.push(phrase);
  }
  if (phraseHits.length >= 2) {
    out.push({
      id: "rhythm:ai-phrases",
      severity: "hard",
      category: "AI phrases",
      message: `${phraseHits.length} over-represented LLM phrases detected.`,
      detail: phraseHits.join(" | "),
    });
  } else if (phraseHits.length === 1) {
    out.push({
      id: "rhythm:ai-phrase-one",
      severity: "soft",
      category: "AI phrases",
      message: `One over-represented LLM phrase: "${phraseHits[0]}".`,
    });
  }

  // 4. Fano factor on bullet word counts as a second-axis burstiness
  //    signal (the existing checkBulletLengthVariance uses stddev; this
  //    uses variance/mean and trips on different patterns). Only fires
  //    on egregious clustering — < 0.5.
  const bulletWordCounts = [...body.matchAll(/^[-*]\s+(.+)$/gm)]
    .map((m) => (m[1].match(/\S+/g) ?? []).length)
    .filter((n) => n >= 3);
  if (bulletWordCounts.length >= 8) {
    const mean =
      bulletWordCounts.reduce((s, n) => s + n, 0) / bulletWordCounts.length;
    if (mean > 0) {
      const variance =
        bulletWordCounts.reduce((s, n) => s + (n - mean) ** 2, 0) /
        bulletWordCounts.length;
      const fano = variance / mean;
      if (fano < 0.5) {
        out.push({
          id: "rhythm:fano",
          severity: "soft",
          category: "Rhythm",
          message: `Bullets cluster too tightly (Fano factor ${fano.toFixed(2)}; human writing trends 0.6+).`,
        });
      }
    }
  }
}

// ----- helpers --------------------------------------------------------------

function stripAtsKeywordsSection(md: string): string {
  // Drop everything between `## ATS Keywords` and the first `---` so the
  // keyword bullets (intentionally one-word-each) don't pollute prose
  // checks.
  const start = /^##\s+ATS Keywords\s*$/im.exec(md);
  if (!start) return md;
  const rest = md.slice(start.index + start[0].length);
  const end = /^---\s*$/m.exec(rest);
  if (!end) return md;
  return md.slice(0, start.index) + rest.slice(end.index + end[0].length);
}

function isAtsKeywordOpener(word: string): boolean {
  // Some keyword-list bullets start with the same generic word ("a",
  // "an", "the") and we don't want to count those.
  return ["a", "an", "the"].includes(word);
}

function extractContext(text: string, idx: number, span: number): string {
  const start = Math.max(0, idx - span);
  const end = Math.min(text.length, idx + span);
  const fragment = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `…${fragment}…`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
