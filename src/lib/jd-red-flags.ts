// Pure JS — scans a job description for known culture / workload /
// transparency red flags. Surfaces them as advisory (never blocks a
// generation); the user decides whether to apply.
//
// Patterns synthesized from §5.4 of the May-2026 research report:
// Ongig 2026, JobAdvisor 2026, 180 Engineering, Rewriting the Code,
// Project Include, plus the documented pay-transparency studies. Each
// pattern has a documented secondary signal — they aren't gut feelings.

export type RedFlagCategory =
  | "workload" // long hours / over-staffing / "rockstar" framing
  | "transparency" // missing salary / vague comp / hidden benefits
  | "culture" // toxic culture / lack of boundaries / hostile feedback
  | "instability"; // repost frequency, vague role definition

export type RedFlag = {
  category: RedFlagCategory;
  /** Human-readable summary of why this is a flag. */
  message: string;
  /** Verbatim snippet from the JD that triggered the match. */
  snippet: string;
};

type PatternSpec = {
  pattern: RegExp;
  category: RedFlagCategory;
  message: string;
};

// Tier 1 — direct workload red flags. The "rockstar / ninja / guru"
// cluster is gendered male-coded per Project Include's research and
// signals over-staffing expectations.
const WORKLOAD_PATTERNS: PatternSpec[] = [
  {
    pattern: /\brockstar\b/i,
    category: "workload",
    message: '"Rockstar" — usually signals one person doing the job of three.',
  },
  {
    pattern: /\bninja\b/i,
    category: "workload",
    message: '"Ninja" — same workload-inflation signal; also gendered.',
  },
  {
    pattern: /\b(guru|wizard|superhero)\b/i,
    category: "workload",
    message:
      "Hero-role language — signals high workload expectations and / or a thin team.",
  },
  {
    pattern: /\b10x\s+engineer\b/i,
    category: "workload",
    message: '"10x engineer" — same hero framing.',
  },
  {
    pattern: /\bwear(?:s|ing)?\s+(?:many|multiple)\s+hats\b/i,
    category: "workload",
    message:
      '"Wear many hats" — often code for understaffing or undefined role scope.',
  },
  {
    pattern: /\bwork\s+hard,?\s*play\s+hard\b/i,
    category: "workload",
    message: '"Work hard, play hard" — long hours dressed up with team events.',
  },
  {
    pattern: /\bwe(?:'re|\s+are)\s+(?:like\s+)?a\s+family\b/i,
    category: "culture",
    message:
      '"We\'re a family" — blurred boundaries, expectation of loyalty over compensation.',
  },
  {
    pattern: /\bfast[-\s]paced\b/i,
    category: "workload",
    message:
      '"Fast-paced" — sometimes legitimate; with other flags, indicates chronic stress.',
  },
  {
    pattern: /\btight\s+deadlines\b/i,
    category: "workload",
    message: '"Tight deadlines" — direct workload red flag.',
  },
  {
    pattern: /\blong\s+hours\b/i,
    category: "workload",
    message: '"Long hours" — direct workload red flag.',
  },
  {
    pattern: /\bhigh[-\s]pressure\b/i,
    category: "workload",
    message: '"High-pressure" — direct stress signal.',
  },
];

// Tier 3 — cultural red flags. Less about workload, more about norms.
const CULTURE_PATTERNS: PatternSpec[] = [
  {
    pattern: /\bthick\s+skin\b/i,
    category: "culture",
    message: '"Thick skin required" — often code for harsh internal feedback.',
  },
  {
    pattern: /\bstrong\s+personality\b/i,
    category: "culture",
    message: '"Strong personality" — same feedback-culture signal.',
  },
  {
    pattern: /\bavailable\s+24\s*[\/\\]?\s*7\b/i,
    category: "culture",
    message: 'Demands 24/7 availability outside on-call rotations.',
  },
  {
    pattern: /\bon[-\s]call\s+24[\/\\]?7\b/i,
    category: "culture",
    message: '24/7 on-call expectations.',
  },
  {
    pattern: /\brespond\s+(?:quickly|immediately)\b/i,
    category: "culture",
    message: "Implicit always-on response expectation.",
  },
  {
    pattern: /\bhustle\b/i,
    category: "culture",
    message: '"Hustle" — often paired with under-compensation.',
  },
  {
    pattern: /\bpassion[-\s]driven\b/i,
    category: "culture",
    message: '"Passion-driven" — can substitute passion for fair pay.',
  },
];

// Tier 2 — transparency. These check ABSENCE of expected signals (paid
// range, benefits), which requires the full JD text rather than a phrase
// scan. Detection is conservative — we only flag when the JD has a comp
// section that's clearly vague.
const VAGUE_COMP_PATTERNS: PatternSpec[] = [
  {
    pattern: /\bcompetitive\s+(?:salary|compensation|pay)\b/i,
    category: "transparency",
    message:
      '"Competitive salary" without a stated range — in pay-transparency jurisdictions this is increasingly a legal red flag.',
  },
  {
    pattern: /\bcompensation\s+commensurate\s+with\s+experience\b/i,
    category: "transparency",
    message:
      '"Commensurate with experience" — no actual range disclosed.',
  },
  {
    pattern: /\bdoe\b/i, // "Depending on experience"
    category: "transparency",
    message: '"DOE" — same as commensurate-with-experience; no transparency.',
  },
];

const ALL_PATTERNS: PatternSpec[] = [
  ...WORKLOAD_PATTERNS,
  ...CULTURE_PATTERNS,
  ...VAGUE_COMP_PATTERNS,
];

/**
 * Scan a JD for known red-flag patterns. Returns an empty list when
 * nothing matches. Order matters for UX — workload first, then culture,
 * then transparency, since that maps to candidate-decision priority.
 */
export function scanJdRedFlags(jdText: string): RedFlag[] {
  if (!jdText || jdText.length < 30) return [];
  const flags: RedFlag[] = [];
  const seenIds = new Set<string>();
  for (const spec of ALL_PATTERNS) {
    const match = spec.pattern.exec(jdText);
    if (!match) continue;
    // Dedupe by message so the same pattern only fires once per scan
    // even if the phrase appears multiple times.
    if (seenIds.has(spec.message)) continue;
    seenIds.add(spec.message);
    flags.push({
      category: spec.category,
      message: spec.message,
      snippet: extractSnippet(jdText, match.index, 80),
    });
  }
  // Also check for ABSENCE of any salary range — independent heuristic
  // since it's measured against the whole text, not a pattern match.
  if (
    !/\$\s?\d{2,3}[k,]/i.test(jdText) && // $120k, $120,000
    !/\d{2,3}[k,]\s*(?:[-–to]+\s*)?\d{2,3}[k,]?\s+(?:per\s+year|annual)/i.test(jdText) &&
    /salary|compensation|pay|comp/i.test(jdText)
  ) {
    flags.push({
      category: "transparency",
      message: "No explicit salary range despite mentioning compensation.",
      snippet: "",
    });
  }
  return flags;
}

/**
 * Pull a ~80-char window around a regex hit so the user sees the
 * offending phrase in context, not stripped of meaning.
 */
function extractSnippet(text: string, idx: number, span: number): string {
  const start = Math.max(0, idx - Math.floor(span / 2));
  const end = Math.min(text.length, idx + Math.ceil(span / 2));
  const fragment = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `…${fragment}…`;
}
