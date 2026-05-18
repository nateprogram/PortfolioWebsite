// Heuristic quality checks for cover-letter output. Subset of the
// resume checks (META, banlist, dashes, separators, tricolons) plus
// CL-specific rules (no cliche openers/closers, ~200-300 word target).
//
// Returns the same CheckResult shape as resume-checks so the auto-retry
// loop in the builder can treat both flows uniformly.

import type { CheckIssue, CheckResult } from "./resume-checks";

// Subset of the resume banlist plus cover-letter-specific cliches.
const BANLIST = [
  // Sticky LLM tells (Rule A in the system prompt).
  "ensure", "ensuring", "end-to-end", "standardize", "standardized",
  // Adjective fluff.
  "leverage", "robust", "comprehensive", "cutting-edge", "innovative",
  "passionate", "seamless", "performant", "transformative", "dynamic",
  "vibrant", "myriad", "intricate", "holistic", "synergy",
  // Hype verbs.
  "spearhead", "spearheaded", "orchestrate", "orchestrated",
  "foster", "fostered", "empower", "empowered",
  "streamline", "streamlined", "elevate", "modernize",
  "facilitate", "facilitated", "demonstrate", "demonstrating",
  "showcase", "showcasing", "architected", "utilize", "utilizing",
  // Cliche openers — cover letters are flooded with these.
  "I am writing to apply",
  "I am writing to express",
  "I am excited to apply",
  "I am thrilled to apply",
  "I am passionate about",
  "I would like to express",
  "I would like to apply",
  // Cliche closers.
  "look forward to hearing",
  "eager to contribute",
  "would be an asset",
  "perfect fit",
  "ideal candidate",
  // Soft hedges + corporate filler.
  "significantly", "substantially", "considerably",
  "effectively", "efficiently", "successfully",
  "best-in-class", "cross-functional", "production-shaped",
];

export function checkCoverLetter(markdown: string): CheckResult {
  const issues: CheckIssue[] = [];

  if (!markdown || markdown.length < 200) {
    issues.push({
      id: "length:too-short",
      severity: "hard",
      category: "Output truncated",
      message: `Output is only ${markdown.length} characters; cover letters target 1000+.`,
    });
    return finalize(issues);
  }

  checkMetaBlock(markdown, issues);
  checkBanlist(markdown, issues);
  checkDashes(markdown, issues);
  checkSeparators(markdown, issues);
  checkTricolons(markdown, issues);
  checkWordCount(markdown, issues);
  checkSignature(markdown, issues);

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
    });
  }
}

function checkBanlist(md: string, out: CheckIssue[]) {
  for (const word of BANLIST) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    const m = re.exec(md);
    if (m) {
      out.push({
        id: `banlist:${word.replace(/\s+/g, "_").toLowerCase()}`,
        severity: "hard",
        category: "Banned phrase",
        message: `"${m[0]}" is on the cover-letter banlist.`,
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
    });
  }
  if (en > 0) {
    out.push({
      id: "dashes:en",
      severity: "hard",
      category: "En dashes",
      message: `Found ${en} en dash${en === 1 ? "" : "es"} (–).`,
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
    });
  }
}

function checkTricolons(md: string, out: CheckIssue[]) {
  const matches = md.match(/\w+,\s+[\w\s]+,\s+and\s+\w+/g) || [];
  if (matches.length === 0) return;
  if (matches.length >= 3) {
    out.push({
      id: "tricolon:many",
      severity: "hard",
      category: "Tricolons",
      message: `Found ${matches.length} "X, Y, and Z" patterns.`,
      detail: matches.slice(0, 3).join(" | "),
    });
  } else {
    out.push({
      id: "tricolon:few",
      severity: "soft",
      category: "Tricolon",
      message: `${matches.length} "X, Y, and Z" pattern${matches.length === 1 ? "" : "s"}.`,
      detail: matches.join(" | "),
    });
  }
}

function checkWordCount(md: string, out: CheckIssue[]) {
  // Strip the META block before counting body words.
  const body = md.replace(/\[META\][\s\S]*?\[\/META\]/, "");
  const words = (body.match(/\S+/g) ?? []).length;
  if (words < 150) {
    out.push({
      id: "wordcount:short",
      severity: "hard",
      category: "Length",
      message: `Letter body is only ${words} words; target 200-300.`,
    });
  } else if (words > 350) {
    out.push({
      id: "wordcount:long",
      severity: "soft",
      category: "Length",
      message: `Letter body is ${words} words; target 200-300 to keep recruiter attention.`,
    });
  }
}

function checkSignature(md: string, out: CheckIssue[]) {
  // The system prompt requires the signature block at the end. If it's
  // missing, the model went off-format.
  if (!/sincerely[,\s]+nate white/i.test(md)) {
    out.push({
      id: "signature:missing",
      severity: "hard",
      category: "Signature block",
      message: 'Missing the "Sincerely, Nate White" signature line.',
    });
  }
}

// ----- utilities ------------------------------------------------------------

function extractContext(text: string, idx: number, span: number): string {
  const start = Math.max(0, idx - span);
  const end = Math.min(text.length, idx + span);
  return `…${text.slice(start, end).replace(/\s+/g, " ").trim()}…`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
