// Pure helpers for the application tracker's status/stage system.
// Split out of applications-client.tsx so the colors/labels can be
// reused by row, filter, and badge components without dragging React
// imports along.

import type { ApplicationStatus } from "@/lib/applications-store";

/** Canonical status order — used by selects and pipeline displays. */
export const STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "rejected",
  "offer",
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer",
};

/**
 * Tailwind utility classes for each status pill. Background-tint +
 * text-color pairs mapped to the project's existing palette.
 */
export const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  interested:
    "bg-muted/60 text-muted-foreground border border-border",
  applied:
    "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40",
  interview:
    "bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40",
  rejected:
    "bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40",
  offer:
    "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40",
};

/**
 * Visible-stage axis. Interested/applied/interview map 1:1; both
 * terminal outcomes (rejected, offer) collapse into a single "outcome"
 * column. Used by the filter chips and the summary counts at the top.
 */
export type Stage = "interested" | "applied" | "interview" | "outcome";

export const STAGES: Stage[] = ["interested", "applied", "interview", "outcome"];

export const STAGE_LABEL: Record<Stage, string> = {
  interested: "Interested",
  applied: "Applied",
  interview: "Interview",
  outcome: "Outcome",
};

export function stageFor(status: ApplicationStatus): Stage {
  if (status === "rejected" || status === "offer") return "outcome";
  return status;
}
