// Pure parsing + formatting helpers for the resume builder UI.
// No React, no fetch — safe to import from server components, tests,
// and the renderer alike.

import type { CheckIssue, CheckResult } from "@/lib/resume/checks";

/** Pull the resume body out of the model's combined output (everything after the first `---`). */
export function extractResume(combined: string): string {
  const lines = combined.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      return lines.slice(i + 1).join("\n").trimStart();
    }
  }
  return combined;
}

/**
 * Remove the `[META] … [/META]` block from a string before showing it
 * to the user. Tolerant of partial streams — if `[/META]` hasn't
 * arrived yet, hides everything from `[META]` to end-of-buffer instead
 * of leaking the half-formed block into the preview.
 */
export function stripMetaForDisplay(s: string): string {
  if (!s) return s;
  const start = s.indexOf("[META]");
  if (start === -1) return s;
  const end = s.indexOf("[/META]", start);
  if (end === -1) return s.slice(0, start).trimEnd();
  const after = s.slice(end + "[/META]".length);
  return (s.slice(0, start) + after).replace(/^\s+/, "");
}

/**
 * Pull the ATS-keyword bullet list out of the `## ATS Keywords` section.
 * Returns `[]` while the section hasn't streamed yet or if the model
 * omits it.
 */
export function parseAtsKeywords(output: string): string[] {
  if (!output) return [];
  const headingMatch = /^##\s+ATS\s+Keywords\s*$/im.exec(output);
  if (!headingMatch) return [];
  const start = headingMatch.index + headingMatch[0].length;
  const rest = output.slice(start);
  const endMatch = /^---\s*$/m.exec(rest);
  const block = endMatch ? rest.slice(0, endMatch.index) : rest;
  const keywords: string[] = [];
  for (const line of block.split("\n")) {
    const m = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
    if (m && m[1]) keywords.push(m[1]);
  }
  return keywords;
}

/** Parse the META block. Both fields optional — callers fall back gracefully. */
export function parseMeta(s: string): { company?: string; position?: string } {
  const m = /\[META\]([\s\S]*?)\[\/META\]/.exec(s);
  if (!m) return {};
  const block = m[1];
  const company = /^\s*company\s*:\s*(.+?)\s*$/im.exec(block)?.[1];
  const position = /^\s*position\s*:\s*(.+?)\s*$/im.exec(block)?.[1];
  return {
    company: company && company.toLowerCase() !== "unknown" ? company : undefined,
    position: position || undefined,
  };
}

/** True iff an issue came from the Groq/Llama judge (id prefix `judge:`). */
export function isJudgeIssue(issue: CheckIssue): boolean {
  return issue.id.startsWith("judge:");
}

/**
 * Fold judge issues into an existing CheckResult and regenerate
 * `retryNotes` so the retry prompt to Gemini includes both heuristic
 * and judge findings. Hard issues append to hardFails; soft to soft.
 */
export function mergeJudgeIssues(
  base: CheckResult,
  judgeIssues: CheckIssue[],
): CheckResult {
  const hardFails = [
    ...base.hardFails,
    ...judgeIssues.filter((i) => i.severity === "hard"),
  ];
  const softFails = [
    ...base.softFails,
    ...judgeIssues.filter((i) => i.severity === "soft"),
  ];
  const retryNotes = hardFails
    .map((i, idx) => {
      const head = `${idx + 1}. [${i.category}] ${i.message}`;
      return i.detail ? `${head}\n   detail: ${i.detail}` : head;
    })
    .join("\n");
  return {
    passed: hardFails.length === 0,
    hardFails,
    softFails,
    retryNotes,
  };
}

/** Compact date format for history rows. Today shows time; older shows date. */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });
}
