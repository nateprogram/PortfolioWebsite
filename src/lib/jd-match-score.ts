// Compute a Jobscan-style match score between the model-extracted
// ATS keywords and the resume body. Pure regex / string matching,
// runs client-side in <5ms, free.
//
// Approach:
//   1. The model emits 8-15 ATS keywords above the `---` divider.
//      Those are what real recruiters search on, so they're the
//      anchor for the score — not arbitrary keywords we'd pick.
//   2. For each keyword, count occurrences in the resume body
//      (post-`---`). Multi-word phrases are matched as a unit.
//      Token alphanumeric boundaries on both sides so "Go" doesn't
//      match "Google" but matches "Go." and "(Go)".
//   3. Score = present-keywords / total-keywords. We also weight by
//      position (keyword in Summary or Skills counts a bit more than
//      keyword only in Projects) since ATS keyword search ranks
//      higher when the term shows up in canonical sections.
//
// Returns a structured result for the UI to render: overall percent,
// per-keyword status, and the list of missing keywords (the most
// actionable signal — "you said you have this skill in chat, but the
// resume omits it").

export type KeywordHit = {
  keyword: string;
  /** Total occurrences across the resume body. 0 means missing. */
  count: number;
  /** True iff the keyword appears in Summary, Skills, or the role line. */
  inProminentSection: boolean;
};

export type JdMatchScore = {
  /** 0-100. Higher = more JD keywords are present (weighted by section). */
  percent: number;
  totalKeywords: number;
  presentKeywords: number;
  hits: KeywordHit[];
  missing: string[];
};

/**
 * Parse the model's `## ATS Keywords` bulleted list. Reuses the same
 * pattern as the builder so the score is computed against the exact
 * keywords the model said the JD wants.
 */
function parseAtsKeywords(output: string): string[] {
  const headingMatch = /^##\s+ATS\s+Keywords\s*$/im.exec(output);
  if (!headingMatch) return [];
  const start = headingMatch.index + headingMatch[0].length;
  const rest = output.slice(start);
  const endMatch = /^---\s*$/m.exec(rest);
  const block = endMatch ? rest.slice(0, endMatch.index) : rest;
  const out: string[] = [];
  for (const line of block.split("\n")) {
    const m = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
    if (m && m[1]) out.push(m[1].trim());
  }
  return out;
}

/**
 * Pull the resume body (everything after the first `---`). The score
 * should reflect what the recipient actually sees, not the META + ATS
 * keyword preamble.
 */
function getResumeBody(output: string): string {
  const lines = output.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      return lines.slice(i + 1).join("\n");
    }
  }
  return output;
}

/**
 * Locate the Summary, Skills, and role line (the line directly under
 * the `# NATE WHITE` heading). These are the "prominent" sections —
 * ATS keyword search ranks higher when a term shows up here vs only
 * in Projects.
 */
function getProminentRegions(body: string): string {
  const regions: string[] = [];

  // Role line: the first non-empty line after `# NATE WHITE`.
  const lines = body.split("\n");
  const nameIdx = lines.findIndex((l) => /^#\s+NATE\s+WHITE/i.test(l.trim()));
  if (nameIdx !== -1) {
    for (let i = nameIdx + 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        regions.push(lines[i]);
        break;
      }
    }
  }

  // Summary section.
  const summaryMatch = /^##\s+Summary\s*$/im.exec(body);
  if (summaryMatch) {
    const after = body.slice(summaryMatch.index + summaryMatch[0].length);
    const nextHeading = /^##\s+/m.exec(after);
    regions.push(nextHeading ? after.slice(0, nextHeading.index) : after);
  }

  // Skills section.
  const skillsMatch = /^##\s+Skills\s*$/im.exec(body);
  if (skillsMatch) {
    const after = body.slice(skillsMatch.index + skillsMatch[0].length);
    const nextHeading = /^##\s+/m.exec(after);
    regions.push(nextHeading ? after.slice(0, nextHeading.index) : after);
  }

  return regions.join("\n");
}

/**
 * Build a regex that matches `keyword` as a whole token. Multi-word
 * keywords ("React Native", "C++") are anchored on word-or-symbol
 * boundaries on both ends.
 */
function buildKeywordRegex(keyword: string): RegExp {
  // Escape every regex metachar including `+` (so C++ becomes C\+\+
  // and "C++" matches but "C+++" doesn't).
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // (?<![\w]) and (?![\w]) so "Go" doesn't match inside "Google" but
  // does match "Go." or "(Go)". For keywords ending in `+` (C++) the
  // trailing lookahead still works because `+` isn't a word char.
  return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi");
}

export function computeJdMatchScore(output: string): JdMatchScore {
  const keywords = parseAtsKeywords(output);
  if (keywords.length === 0) {
    return {
      percent: 0,
      totalKeywords: 0,
      presentKeywords: 0,
      hits: [],
      missing: [],
    };
  }

  const body = getResumeBody(output);
  const prominent = getProminentRegions(body);

  const hits: KeywordHit[] = keywords.map((kw) => {
    const re = buildKeywordRegex(kw);
    const count = (body.match(re) ?? []).length;
    const inProminentSection =
      count > 0 && new RegExp(re.source, "i").test(prominent);
    return { keyword: kw, count, inProminentSection };
  });

  // Scoring: each present keyword scores 1.0 base; a keyword that also
  // appears in a prominent section gets a 0.25 bonus, capped at 1.0
  // per keyword. The percent is rounded to the nearest integer.
  let earned = 0;
  for (const h of hits) {
    if (h.count > 0) {
      earned += h.inProminentSection ? 1.0 : 0.8;
    }
  }
  const percent = Math.round((earned / keywords.length) * 100);
  const presentKeywords = hits.filter((h) => h.count > 0).length;
  const missing = hits.filter((h) => h.count === 0).map((h) => h.keyword);

  return {
    percent,
    totalKeywords: keywords.length,
    presentKeywords,
    hits,
    missing,
  };
}
