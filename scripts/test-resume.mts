#!/usr/bin/env -S npx tsx
// scripts/test-resume.mts
//
// E2E test runner for the resume-builder pipeline INCLUDING auto-retry.
// Hits the local Next.js dev server, simulates exactly what the client
// does: POSTs a JD, streams the response, runs `checkResume` against
// the result, and if hard fails are detected, POSTs a retry with the
// previous attempt + failure notes as fix feedback. Repeats up to
// MAX_AUTO_ATTEMPTS.
//
// Dumps each attempt's output to scripts/out/<label>-attempt<N>-<ts>.md.
// At the end, prints a per-JD summary of which attempt won and which
// (if any) hard fails persisted to the end.
//
// Usage:
//   1. In one terminal: npm run dev
//   2. In another:      npx tsx scripts/test-resume.mts scripts/sample-jds/01-cpp-systems.txt
//
// Env:
//   BASE_URL   default http://localhost:3000
//   ENV_FILE   default .env.local

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Node 22's built-in TS support treats .ts files as CommonJS unless the
// package.json says otherwise, which folds all named exports into a
// single `default` export when consumed from ESM. Destructure the
// default (or fall back to the namespace) to get the real function.
import * as resumeChecks from "../src/lib/resume-checks.ts";
import type { CheckResult, CheckIssue } from "../src/lib/resume-checks.ts";
type CheckModule = { checkResume: (md: string) => CheckResult };
const checkResume: CheckModule["checkResume"] =
  (resumeChecks as unknown as { default?: CheckModule } & CheckModule).default
    ?.checkResume ??
  (resumeChecks as unknown as CheckModule).checkResume;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENV_FILE = path.resolve(ROOT, process.env.ENV_FILE ?? ".env.local");
const MAX_AUTO_ATTEMPTS = 3;

type RetryContext = { previousAttempt: string; failureNotes: string };

async function main() {
  const jdPaths = process.argv.slice(2).map((p) => path.resolve(p));
  if (jdPaths.length === 0) {
    console.error(
      "Usage: npx tsx scripts/test-resume.mts <path-to-jd> [more JDs ...]",
    );
    process.exit(2);
  }

  const envVars = await readEnvFile(ENV_FILE);
  const unlockKey = envVars.RESUME_TOOL_KEY;
  if (!unlockKey) {
    console.error(`RESUME_TOOL_KEY missing in ${ENV_FILE}.`);
    process.exit(2);
  }

  console.log(`[setup] base URL: ${BASE_URL}`);
  await assertDevServerUp();
  const cookie = await unlock(unlockKey);
  console.log(`[setup] auth cookie acquired: ${cookie.slice(0, 18)}...`);

  for (const jdPath of jdPaths) {
    const label = path.basename(jdPath, path.extname(jdPath));
    console.log(`\n=== ${label} ===`);
    const jd = await fs.readFile(jdPath, "utf8");
    await runChain(label, jd, cookie);
  }
}

async function runChain(label: string, jd: string, cookie: string) {
  const outDir = path.join(ROOT, "scripts", "out");
  await fs.mkdir(outDir, { recursive: true });

  let bestMarkdown = "";
  let bestChecks: CheckResult | null = null;
  let bestJudgeRan = false;

  for (let attempt = 1; attempt <= MAX_AUTO_ATTEMPTS; attempt++) {
    const t0 = Date.now();
    const retry: RetryContext | undefined =
      attempt > 1 && bestChecks
        ? { previousAttempt: bestMarkdown, failureNotes: bestChecks.retryNotes }
        : undefined;
    let markdown: string;
    try {
      markdown = await streamOnce(jd, cookie, retry);
    } catch (err) {
      console.log(
        `  [attempt ${attempt}] ERROR: ${(err as Error).message}`,
      );
      continue;
    }
    const genElapsed = ((Date.now() - t0) / 1000).toFixed(1);

    let checks = checkResume(markdown);

    // If heuristics pass, ask the judge for a second opinion (matches
    // production behavior in builder.tsx).
    let judgeRan = false;
    if (checks.passed) {
      const tJudge = Date.now();
      const judge = await fetchJudge(jd, markdown, cookie);
      judgeRan = judge.ran;
      if (judge.issues.length > 0) {
        checks = mergeJudgeIssues(checks, judge.issues);
      }
      const judgeElapsed = ((Date.now() - tJudge) / 1000).toFixed(1);
      if (judgeRan) {
        console.log(
          `    [judge] ${judgeElapsed}s · ${judge.issues.length} issue${
            judge.issues.length === 1 ? "" : "s"
          }`,
        );
      } else {
        console.log(`    [judge] skipped (disabled or errored)`);
      }
    }

    // Persist this attempt's raw output for inspection.
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${label}-attempt${attempt}-${ts}.md`;
    await fs.writeFile(path.join(outDir, fileName), markdown);

    const passLabel =
      checks.hardFails.length === 0
        ? "PASS"
        : `${checks.hardFails.length} hard, ${checks.softFails.length} soft`;
    console.log(
      `  [attempt ${attempt}] gen ${genElapsed}s · ${markdown.length} chars · ${passLabel} · ${fileName}`,
    );
    printIssues("    hard", checks.hardFails);

    if (
      bestChecks === null ||
      checks.hardFails.length <= bestChecks.hardFails.length
    ) {
      bestMarkdown = markdown;
      bestChecks = checks;
      bestJudgeRan = judgeRan;
    }
    if (checks.hardFails.length === 0) break;
  }

  console.log("  --- chain summary ---");
  if (!bestChecks) {
    console.log("    no successful attempts");
    return;
  }
  const judgeNote = bestJudgeRan ? " (Llama cross-checked)" : "";
  if (bestChecks.hardFails.length === 0) {
    console.log(
      `    OVERALL: ✅  passed${judgeNote} · ${bestChecks.softFails.length} soft warnings`,
    );
    printIssues("    soft", bestChecks.softFails);
  } else {
    console.log(
      `    OVERALL: ❌  ${bestChecks.hardFails.length} hard fails remain after ${MAX_AUTO_ATTEMPTS} attempts${judgeNote}`,
    );
    printIssues("    hard", bestChecks.hardFails);
  }
}

async function fetchJudge(
  jd: string,
  markdown: string,
  cookie: string,
): Promise<{ issues: CheckIssue[]; ran: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/api/resume/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ jobDescription: jd, markdown }),
    });
    if (!res.ok) return { issues: [], ran: false };
    const data = (await res.json()) as {
      issues?: CheckIssue[];
      enabled?: boolean;
    };
    return {
      issues: Array.isArray(data.issues) ? data.issues : [],
      ran: data.enabled !== false,
    };
  } catch {
    return { issues: [], ran: false };
  }
}

function mergeJudgeIssues(
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

function printIssues(prefix: string, issues: CheckIssue[]) {
  for (const i of issues) {
    const detail = i.detail ? `  (${i.detail})` : "";
    console.log(`${prefix}: [${i.category}] ${i.message}${detail}`);
  }
}

async function readEnvFile(file: string): Promise<Record<string, string>> {
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (err) {
    console.error(`Could not read ${file}: ${(err as Error).message}`);
    process.exit(2);
  }
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

async function assertDevServerUp(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    if (res.status >= 500) throw new Error(`dev server returned ${res.status}`);
  } catch (err) {
    console.error(
      `Dev server not reachable at ${BASE_URL}. Run 'npm run dev' in another terminal first.\n  underlying: ${(err as Error).message}`,
    );
    process.exit(2);
  }
}

async function unlock(key: string): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/resume/unlock?key=${encodeURIComponent(key)}`,
    { method: "GET", redirect: "manual" },
  );
  // Node 22's Headers has getSetCookie(); older Node falls back to a
  // single concatenated string.
  type SetCookieHeaders = Headers & { getSetCookie?: () => string[] };
  const headers = res.headers as SetCookieHeaders;
  const cookies = headers.getSetCookie
    ? headers.getSetCookie()
    : [res.headers.get("set-cookie") ?? ""].filter(Boolean);
  const session = cookies.find((c) => /^resume_session=/i.test(c));
  if (!session) {
    console.error(
      `Unlock failed: no resume_session cookie returned (status ${res.status}).`,
    );
    process.exit(2);
  }
  return session.split(";")[0];
}

async function streamOnce(
  jd: string,
  cookieHeader: string,
  retry?: RetryContext,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ jobDescription: jd, retry }),
  });
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Generate failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
  }
  acc += decoder.decode();
  return acc;
}

main().catch((err) => {
  console.error("FATAL:", (err as Error).message);
  process.exit(1);
});
