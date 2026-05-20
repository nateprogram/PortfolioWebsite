"use client";

// UI primitives the Builder composes. Pulled out of builder.tsx so the
// big component stays focused on state + orchestration.

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCw,
  Sparkles,
} from "lucide-react";
import type { CheckIssue, CheckResult } from "@/lib/resume/checks";
import type { JdMatchScore } from "@/lib/jd-match-score";
import { isJudgeIssue } from "./parsers";

/**
 * Shared status enum for both resume and cover-letter generation
 * pipelines. The Builder owns the state; subcomponents take it as a
 * prop and switch their rendering on it.
 *
 *   idle      — nothing in flight
 *   streaming — first attempt streaming
 *   checking  — running heuristics on the just-streamed markdown
 *   judging   — running the Groq / Llama cross-reference critic
 *   retrying  — a follow-up attempt is streaming
 *   done      — accepted (passed checks + judge cleanly)
 *   warning   — finished retries with residual hard fails (manual fix needed)
 *   error     — network / API / stream error
 */
export type Status =
  | "idle"
  | "streaming"
  | "checking"
  | "judging"
  | "retrying"
  | "done"
  | "warning"
  | "error";

/** Numbered step header above each section card ("01 · Job description"). */
export function StepHeader({
  index,
  label,
  right,
}: {
  index: string;
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="text-foreground/40 tabular-nums">{index}</span>
        <span className="size-1 rounded-full bg-border" aria-hidden />
        <span>{label}</span>
      </div>
      {right}
    </div>
  );
}

/** Tiny pill in the output card header that mirrors the current Status. */
export function StreamStatus({
  status,
  attempt,
  max,
}: {
  status: Status;
  attempt: number;
  max: number;
}) {
  if (status === "streaming") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <span className="relative flex size-1.5">
          <span className="animate-ping absolute inline-flex size-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        Streaming · attempt {attempt}/{max}
      </span>
    );
  }
  if (status === "checking") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Running quality checks
      </span>
    );
  }
  if (status === "judging") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Cross-checking with Llama 3.3 70B
      </span>
    );
  }
  if (status === "retrying") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-400">
        <RotateCw className="size-3 animate-spin" aria-hidden />
        Retrying · attempt {attempt}/{max}
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3" aria-hidden />
        Passed all checks
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-400">
        <AlertTriangle className="size-3" aria-hidden />
        Needs manual review
      </span>
    );
  }
  return null;
}

/** Amber banner shown while a retry is in flight, with the reason string. */
export function RetryBanner({ reason }: { reason: string }) {
  return (
    <div className="rounded-md border border-amber-200/70 bg-amber-50/60 px-3 py-2 flex items-center gap-2 text-sm dark:border-amber-900/40 dark:bg-amber-900/10">
      <RotateCw
        className="size-4 animate-spin text-amber-700 dark:text-amber-400"
        aria-hidden
      />
      <span className="text-amber-900 dark:text-amber-200 font-mono text-xs">
        {reason}
      </span>
    </div>
  );
}

/**
 * Summary panel above the resume preview. Three modes:
 *   warning  — residual hard fails after retries (red box, manual fix list)
 *   done + softFails — green check + collapsible "show" details
 *   done + clean    — single-line "All checks passed"
 */
export function ChecksPanel({
  result,
  status,
  judgeRan,
}: {
  result: CheckResult;
  status: Status;
  judgeRan: boolean;
}) {
  const judgeBadge = judgeRan ? (
    <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/40 px-1.5 py-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
      <Sparkles className="size-2.5" aria-hidden />
      Llama 3.3 cross-checked
    </span>
  ) : null;

  if (status === "warning" && result.hardFails.length > 0) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <span>
            {result.hardFails.length} issue
            {result.hardFails.length === 1 ? "" : "s"} need manual review
          </span>
          {judgeBadge}
        </div>
        <p className="text-[11px] text-muted-foreground -mt-0.5">
          Auto-retry hit its limit. Copy the resume, fix these, then re-paste
          into your editor before sending.
        </p>
        <ul className="flex flex-col gap-1.5 text-xs">
          {result.hardFails.map((issue, i) => (
            <IssueRow key={`${issue.id}-${i}`} issue={issue} tone="hard" />
          ))}
        </ul>
      </div>
    );
  }
  if (status === "done" && result.softFails.length > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2
          className="size-3.5 text-emerald-700 dark:text-emerald-400"
          aria-hidden
        />
        <span>
          Passed with {result.softFails.length} minor warning
          {result.softFails.length === 1 ? "" : "s"}
        </span>
        {judgeBadge}
        <details className="cursor-pointer">
          <summary className="text-muted-foreground hover:text-foreground select-none">
            show
          </summary>
          <ul className="mt-1 ml-2 list-disc pl-3 text-muted-foreground/80 space-y-0.5">
            {result.softFails.map((issue, i) => (
              <li key={`${issue.id}-${i}`}>
                {isJudgeIssue(issue) && (
                  <span className="font-mono text-[10px] text-muted-foreground/60 mr-1">
                    [llama]
                  </span>
                )}
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 mr-1">
                  {issue.category}:
                </span>
                {issue.message}
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  }
  if (status === "done" && result.passed) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" aria-hidden />
        <span className="font-mono">All quality checks passed</span>
        {judgeBadge}
      </div>
    );
  }
  return null;
}

/**
 * JD-keyword match score panel. Color-coded by Jobscan's rough buckets:
 *   80%+    excellent (emerald)
 *   60-79%  acceptable but improvable (amber)
 *   <60%    too many JD keywords missing (red)
 */
export function MatchScorePanel({ score }: { score: JdMatchScore }) {
  const tone: "good" | "ok" | "low" =
    score.percent >= 80 ? "good" : score.percent >= 60 ? "ok" : "low";
  const toneClasses = {
    good: {
      ring: "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10",
      number: "text-emerald-700 dark:text-emerald-400",
      label: "text-emerald-900 dark:text-emerald-300",
    },
    ok: {
      ring: "border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10",
      number: "text-amber-700 dark:text-amber-400",
      label: "text-amber-900 dark:text-amber-300",
    },
    low: {
      ring: "border-destructive/30 bg-destructive/5",
      number: "text-destructive",
      label: "text-destructive",
    },
  }[tone];

  return (
    <div className={`rounded-md border ${toneClasses.ring} p-3 flex flex-col gap-2`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-semibold tabular-nums ${toneClasses.number}`}
          >
            {score.percent}%
          </span>
          <span className={`text-xs font-mono ${toneClasses.label}`}>
            JD-keyword match · {score.presentKeywords}/{score.totalKeywords}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          weighted by section
        </span>
      </div>
      {score.missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
            Missing:
          </span>
          {score.missing.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-1.5 py-0 text-[10px] font-mono text-muted-foreground"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** One row inside ChecksPanel's hard-fail list. Tags judge-sourced issues with `[llama]`. */
export function IssueRow({
  issue,
  tone,
}: {
  issue: CheckIssue;
  tone: "hard" | "soft";
}) {
  const fromJudge = isJudgeIssue(issue);
  return (
    <li className="flex flex-col gap-0.5">
      <span>
        {fromJudge && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground bg-muted/40 px-1 py-0 rounded-sm mr-1.5">
            llama
          </span>
        )}
        <span
          className={`font-mono text-[10px] uppercase tracking-widest mr-1.5 ${
            tone === "hard" ? "text-destructive/80" : "text-muted-foreground/80"
          }`}
        >
          {issue.category}
        </span>
        <span className="text-foreground">{issue.message}</span>
      </span>
      {issue.detail && (
        <span className="font-mono text-[10px] text-muted-foreground/70 ml-1">
          {issue.detail}
        </span>
      )}
    </li>
  );
}
