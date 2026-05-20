"use client";

// Resume Builder — unlocked-state UI for /tools/resume.
//
// Pipeline: paste JD → POST /api/resume → stream markdown → run
// checkResume → if clean, run judge → if any hard fails, auto-retry
// (up to MAX_AUTO_ATTEMPTS). Best attempt is POSTed to /api/resume/save.
//
// Companion files in this directory:
//   subcomponents.tsx — UI primitives (StepHeader, ChecksPanel, etc.)
//   parsers.ts        — pure parsing helpers (parseMeta, extractResume…)
//   filename.ts       — DOCX filename builders
// See `src/lib/resume/README.md` for the wider architecture map.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  Copy,
  Download,
  FileText,
  Link2,
  Loader2,
  Printer,
  RotateCw,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from "lucide-react";
import Markdown from "react-markdown";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  checkResume,
  type CheckIssue,
  type CheckResult,
} from "@/lib/resume/checks";
import {
  computeJdMatchScore,
  type JdMatchScore,
} from "@/lib/jd-match-score";
import { checkCoverLetter } from "@/lib/cover-letter-checks";
import { scanJdRedFlags, type RedFlag } from "@/lib/jd-red-flags";
import {
  ChecksPanel,
  IssueRow,
  MatchScorePanel,
  RetryBanner,
  StepHeader,
  StreamStatus,
  type Status,
} from "./subcomponents";
import {
  extractResume,
  formatDate,
  mergeJudgeIssues,
  parseAtsKeywords,
  parseMeta,
  stripMetaForDisplay,
} from "./parsers";
import {
  buildCoverLetterFilename,
  buildDownloadFilename,
} from "./filename";

const BLUR_FADE_DELAY = 0.04;
const STORAGE_KEY = "tools/resume:last-jd";
// One initial attempt + one retry. Bumping past 2 has diminishing
// returns: in testing, the first retry fixed ~25% of remaining hard
// fails while the second only added ~10% and sometimes introduced new
// issues while patching old ones. The residual fails after one retry
// are usually 30-second manual fixes (banlist slips, an extra tricolon)
// that aren't worth another full 60-90s Gemini call.
const MAX_AUTO_ATTEMPTS = 2;

// Status type lives in ./subcomponents (it's the shared enum the UI
// pills + this state both speak). FetchStatus is local — only the URL
// fetcher uses it.
type FetchStatus = "idle" | "fetching" | "error";

type HistoryItem = {
  id: string;
  createdAt: number;
  jobDescriptionSnippet: string;
  company?: string;
  position?: string;
};

export function Builder() {
  const [jd, setJd] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<"resume" | "all" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Auto-retry state (cleared at the start of each generate())
  const [attemptNumber, setAttemptNumber] = useState(0); // 1-based; 0 = not generating
  const [retryReason, setRetryReason] = useState<string | null>(null);
  const [checks, setChecks] = useState<CheckResult | null>(null);
  // True iff the Groq / Llama judge actually ran on the accepted output
  // (false if disabled by env var, errored, or never reached because of
  // a generation failure). Drives the "Cross-referenced by Llama" badge.
  const [judgeRan, setJudgeRan] = useState(false);
  // Cover letter state — parallel to the resume state. Initially empty;
  // populated by `generateCoverLetter()` once the user clicks the
  // button that appears after a resume settles.
  const [clOutput, setClOutput] = useState("");
  const [clStatus, setClStatus] = useState<Status>("idle");
  const [clAttemptNumber, setClAttemptNumber] = useState(0);
  const [clRetryReason, setClRetryReason] = useState<string | null>(null);
  const [clChecks, setClChecks] = useState<CheckResult | null>(null);
  const [clCopied, setClCopied] = useState(false);
  const [clDownloading, setClDownloading] = useState(false);

  // Load history once on mount.
  useEffect(() => {
    void refreshHistory();
  }, []);

  async function refreshHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/resume/history", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: HistoryItem[] };
      setHistory(data.items ?? []);
    } catch {
      // Non-critical; history just stays empty.
    } finally {
      setHistoryLoading(false);
    }
  }

  async function generate() {
    const trimmed = jd.trim();
    if (trimmed.length < 30) {
      setErrorMessage("Paste a job description first (at least a sentence or two).");
      setStatus("error");
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // ignore quota / private mode errors
    }

    setErrorMessage(null);
    setOutput("");
    setChecks(null);
    setRetryReason(null);
    setJudgeRan(false);

    // Track the best attempt seen so far so we can persist it even if
    // every attempt has hard fails. "Best" = fewest hard fails, ties
    // broken by most recent.
    let bestMarkdown = "";
    let bestChecks: CheckResult | null = null;

    for (let attempt = 1; attempt <= MAX_AUTO_ATTEMPTS; attempt++) {
      setAttemptNumber(attempt);
      if (attempt === 1) {
        setStatus("streaming");
        setRetryReason(null);
      } else {
        setStatus("retrying");
        const top = (bestChecks?.hardFails ?? [])
          .slice(0, 3)
          .map((c) => c.category.toLowerCase())
          .join(", ");
        setRetryReason(
          `Retry ${attempt}/${MAX_AUTO_ATTEMPTS} · fixing ${top || "checks"}`,
        );
        // Reset visible output so the user sees the new attempt stream in.
        setOutput("");
      }

      let markdown: string;
      try {
        const retry =
          attempt > 1 && bestMarkdown && bestChecks
            ? {
                previousAttempt: bestMarkdown,
                failureNotes: bestChecks.retryNotes,
              }
            : undefined;
        markdown = await streamOneAttempt(trimmed, retry);
      } catch (err) {
        setErrorMessage((err as Error).message);
        setStatus("error");
        setAttemptNumber(0);
        return;
      }

      setStatus("checking");
      let result = checkResume(markdown);

      // If heuristics pass, run the Groq judge for a deeper cross-reference
      // check. Adds the judge's hard/soft findings into the same CheckResult
      // so the retry feedback (and the manual-review panel) treat them
      // identically. If the judge endpoint is disabled or errors, we get
      // back an empty issues array and just keep the heuristic result.
      if (result.passed) {
        setStatus("judging");
        const judge = await fetchJudge(trimmed, markdown);
        if (judge.ran) setJudgeRan(true);
        if (judge.issues.length > 0) {
          result = mergeJudgeIssues(result, judge.issues);
        }
      }

      // Keep the best attempt we've seen.
      if (
        bestChecks === null ||
        result.hardFails.length <= bestChecks.hardFails.length
      ) {
        bestMarkdown = markdown;
        bestChecks = result;
      }

      if (result.hardFails.length === 0) {
        // Clean output (heuristics + judge). Done.
        break;
      }
      // Otherwise loop and retry (if attempts left).
    }

    // Show the best attempt we got.
    setOutput(bestMarkdown);
    setChecks(bestChecks);
    setStatus(bestChecks?.passed ? "done" : "warning");
    setRetryReason(null);
    setAttemptNumber(0);

    // Persist the accepted output (best attempt, even if it had warnings).
    if (bestMarkdown.length > 0) {
      void saveAccepted(trimmed, bestMarkdown).then(() => {
        // Refresh history so the new row shows up.
        setTimeout(() => void refreshHistory(), 400);
      });
    }
  }

  // Single Gemini call. Streams into setOutput as it arrives. Returns
  // the accumulated markdown when the stream closes.
  async function streamOneAttempt(
    trimmed: string,
    retry?: { previousAttempt: string; failureNotes: string },
  ): Promise<string> {
    let res: Response;
    try {
      res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: trimmed, retry }),
      });
    } catch (err) {
      throw new Error(`Network error: ${(err as Error).message}`);
    }
    if (!res.ok || !res.body) {
      let message = `Request failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // body wasn't JSON
      }
      throw new Error(message);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setOutput(acc);
    }
    acc += decoder.decode();
    setOutput(acc);
    return acc;
  }

  // POST the draft to the judge endpoint (Groq + Llama 3.3 70B critic).
  // Errors / disabled judge / timeouts all return ran=false plus an
  // empty list — the heuristic checks remain authoritative; the judge
  // is additive signal.
  async function fetchJudge(
    jobDescription: string,
    markdown: string,
  ): Promise<{ issues: CheckIssue[]; ran: boolean }> {
    try {
      const res = await fetch("/api/resume/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, markdown }),
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

  // Fire-and-forget persistence call. Errors are swallowed: the user
  // already has the rendered output and can copy / download regardless.
  async function saveAccepted(jobDescription: string, markdown: string) {
    try {
      await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, markdown }),
      });
    } catch {
      // non-critical
    }
  }

  // ----- cover letter generation -----------------------------------------
  // Same retry-loop shape as the resume `generate()` but uses the cover
  // letter prompt and the cover-letter check library. No save endpoint
  // and no judge pass — cover letters are short-form and downloaded
  // straight away.
  async function generateCoverLetter() {
    const trimmed = jd.trim();
    if (trimmed.length < 30) {
      setErrorMessage(
        "Paste a job description above first — the cover letter is tailored to it.",
      );
      return;
    }
    setErrorMessage(null);
    setClOutput("");
    setClChecks(null);
    setClRetryReason(null);

    let bestMarkdown = "";
    let bestChecks: CheckResult | null = null;

    for (let attempt = 1; attempt <= MAX_AUTO_ATTEMPTS; attempt++) {
      setClAttemptNumber(attempt);
      if (attempt === 1) {
        setClStatus("streaming");
        setClRetryReason(null);
      } else {
        setClStatus("retrying");
        const top = (bestChecks?.hardFails ?? [])
          .slice(0, 3)
          .map((c) => c.category.toLowerCase())
          .join(", ");
        setClRetryReason(
          `Retry ${attempt}/${MAX_AUTO_ATTEMPTS} · fixing ${top || "checks"}`,
        );
        setClOutput("");
      }

      let markdown: string;
      try {
        const retry =
          attempt > 1 && bestMarkdown && bestChecks
            ? {
                previousAttempt: bestMarkdown,
                failureNotes: bestChecks.retryNotes,
              }
            : undefined;
        markdown = await streamCoverLetterAttempt(trimmed, retry);
      } catch (err) {
        setErrorMessage((err as Error).message);
        setClStatus("error");
        setClAttemptNumber(0);
        return;
      }

      setClStatus("checking");
      const result = checkCoverLetter(markdown);

      if (
        bestChecks === null ||
        result.hardFails.length <= bestChecks.hardFails.length
      ) {
        bestMarkdown = markdown;
        bestChecks = result;
      }
      if (result.hardFails.length === 0) break;
    }

    setClOutput(bestMarkdown);
    setClChecks(bestChecks);
    setClStatus(bestChecks?.passed ? "done" : "warning");
    setClRetryReason(null);
    setClAttemptNumber(0);
  }

  async function streamCoverLetterAttempt(
    trimmed: string,
    retry?: { previousAttempt: string; failureNotes: string },
  ): Promise<string> {
    let res: Response;
    try {
      res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: trimmed, retry }),
      });
    } catch (err) {
      throw new Error(`Network error: ${(err as Error).message}`);
    }
    if (!res.ok || !res.body) {
      let message = `Request failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // body wasn't JSON
      }
      throw new Error(message);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setClOutput(acc);
    }
    acc += decoder.decode();
    setClOutput(acc);
    return acc;
  }

  async function copyCoverLetter() {
    try {
      // Strip the META block from the clipboard text — the user wants
      // the letter, not our internal metadata.
      const text = clOutput.replace(/\[META\][\s\S]*?\[\/META\]\s*/, "");
      await navigator.clipboard.writeText(text);
      setClCopied(true);
      setTimeout(() => setClCopied(false), 1500);
    } catch {
      setErrorMessage("Couldn't copy cover letter to clipboard.");
    }
  }

  async function downloadCoverLetterDocx() {
    setClDownloading(true);
    setErrorMessage(null);
    try {
      const { renderResumeToDocxBlob } = await import(
        "@/lib/resume/markdown-to-docx"
      );
      // The DOCX renderer accepts any markdown that follows the same
      // META + body shape. Cover letters don't have ATS Keywords or
      // section headings, but the renderer's stripPreamble looks for
      // the first `---` — cover letters don't have one, so the entire
      // markdown is treated as body. We feed `---\n` + the letter so
      // the preamble strip removes the META block but keeps the body.
      const body = clOutput.replace(/\[META\][\s\S]*?\[\/META\]/, "").trimStart();
      const wrapped = `---\n${body}`;
      const blob = await renderResumeToDocxBlob(wrapped);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildCoverLetterFilename(clOutput);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(
        `Could not render cover letter .docx: ${(err as Error).message ?? "unknown"}`,
      );
    } finally {
      setClDownloading(false);
    }
  }

  async function downloadCoverLetterPdf() {
    setErrorMessage(null);
    try {
      const { openResumePrintWindow } = await import("@/lib/markdown-to-pdf");
      // Same trick as docx: prepend `---\n` so the print renderer's
      // stripPreamble removes the META block.
      const body = clOutput.replace(/\[META\][\s\S]*?\[\/META\]/, "").trimStart();
      const opened = openResumePrintWindow(`---\n${body}`);
      if (!opened) {
        setErrorMessage(
          "Browser blocked the print window. Allow popups and try again.",
        );
      }
    } catch (err) {
      setErrorMessage(
        `Could not open print window: ${(err as Error).message ?? "unknown"}`,
      );
    }
  }

  function loadLast() {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v) setJd(v);
    } catch {
      // ignore
    }
  }

  async function fetchFromUrl() {
    const url = jobUrl.trim();
    if (!url) return;
    setFetchStatus("fetching");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/resume/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        let message = `Could not fetch URL (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // body wasn't JSON
        }
        setErrorMessage(message);
        setFetchStatus("error");
        return;
      }
      const data = (await res.json()) as { text?: string };
      if (!data.text) {
        setErrorMessage("Page returned no usable text. Paste the JD manually.");
        setFetchStatus("error");
        return;
      }
      setJd(data.text);
      setFetchStatus("idle");
    } catch (err) {
      setErrorMessage(`Network error: ${(err as Error).message}`);
      setFetchStatus("error");
    }
  }

  async function loadFromHistory(id: string) {
    setStatus("streaming");
    setErrorMessage(null);
    setOutput("");
    setChecks(null);
    setRetryReason(null);
    setJudgeRan(false);
    try {
      const res = await fetch(`/api/resume/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setErrorMessage(`Could not load saved resume (${res.status})`);
        setStatus("error");
        return;
      }
      const data = (await res.json()) as {
        jobDescription: string;
        markdown: string;
      };
      setJd(data.jobDescription);
      setOutput(data.markdown);
      // Re-run the heuristic checks on the saved markdown so the panel
      // surfaces any issues this resume shipped with. We don't re-run
      // the judge — it already ran when this row was first generated,
      // and re-judging on every load would burn Groq quota for review
      // sessions.
      const result = checkResume(data.markdown);
      setChecks(result);
      setStatus(result.hardFails.length === 0 ? "done" : "warning");
    } catch (err) {
      setErrorMessage(`Network error: ${(err as Error).message}`);
      setStatus("error");
    }
  }

  async function deleteFromHistory(id: string) {
    if (!confirm("Delete this saved resume? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/resume/${id}`, { method: "DELETE" });
      if (res.ok) await refreshHistory();
    } catch {
      // ignore
    }
  }

  async function copy(which: "resume" | "all") {
    const text =
      which === "resume" ? extractResume(output) : stripMetaForDisplay(output);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setErrorMessage("Couldn't copy to clipboard.");
    }
  }

  async function downloadDocx() {
    setDownloading(true);
    setErrorMessage(null);
    try {
      const { renderResumeToDocxBlob } = await import(
        "@/lib/resume/markdown-to-docx"
      );
      const blob = await renderResumeToDocxBlob(output);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildDownloadFilename(output);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(
        `Could not render .docx: ${(err as Error).message ?? "unknown"}`,
      );
    } finally {
      setDownloading(false);
    }
  }

  // Open a print-styled tab and trigger the browser's print dialog;
  // the user picks "Save as PDF" to get an ATS-friendly text-based PDF.
  async function downloadPdf() {
    setErrorMessage(null);
    try {
      const { openResumePrintWindow } = await import("@/lib/markdown-to-pdf");
      const opened = openResumePrintWindow(output);
      if (!opened) {
        setErrorMessage(
          "Browser blocked the print window. Allow popups for this site and try again.",
        );
      }
    } catch (err) {
      setErrorMessage(
        `Could not open print window: ${(err as Error).message ?? "unknown"}`,
      );
    }
  }

  // Memoize the chunks the output card needs so each keystroke during
  // streaming doesn't re-run the regex parsers from scratch.
  const meta = useMemo(() => parseMeta(output), [output]);
  const atsKeywords = useMemo(() => parseAtsKeywords(output), [output]);
  const resumeBody = useMemo(() => extractResume(output), [output]);
  // JD-match score: regex-based keyword count between the model's
  // emitted ATS Keywords list and the rendered resume body. Re-runs
  // on every output change but only paints once `isSettled` so the
  // user doesn't see flicker mid-stream.
  const matchScore = useMemo<JdMatchScore | null>(() => {
    if (!output || atsKeywords.length === 0 || !resumeBody) return null;
    return computeJdMatchScore(output);
  }, [output, atsKeywords.length, resumeBody]);
  const previewHasContent = Boolean(
    meta.company || meta.position || atsKeywords.length > 0 || resumeBody,
  );
  // Scan the JD for known red-flag phrases (rockstar / ninja / 24/7 /
  // no salary range / etc.). Pure regex pass, cheap to re-run on every
  // keystroke. Surfaces advisory chips below the textarea — never
  // blocks generation.
  const jdRedFlags = useMemo<RedFlag[]>(
    () => (jd.trim().length >= 30 ? scanJdRedFlags(jd) : []),
    [jd],
  );
  // True while the resume retry chain is in flight. Disables input
  // controls so the user can't kick off a second generation mid-loop.
  const isBusy =
    status === "streaming" ||
    status === "retrying" ||
    status === "checking" ||
    status === "judging";
  // Cover letter equivalent. Distinct so the resume controls don't lock
  // up when a cover letter is mid-generation, and vice versa.
  const isClBusy =
    clStatus === "streaming" ||
    clStatus === "retrying" ||
    clStatus === "checking";
  const isClSettled = clStatus === "done" || clStatus === "warning";
  const clMeta = useMemo(() => parseMeta(clOutput), [clOutput]);
  const clBody = useMemo(
    () => clOutput.replace(/\[META\][\s\S]*?\[\/META\]\s*/, "").trimStart(),
    [clOutput],
  );
  // True once the chain has settled (passed or exhausted retries). Output
  // actions and resume preview gating use this.
  const isSettled = status === "done" || status === "warning";

  return (
    <main className="min-h-dvh flex flex-col gap-10">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden /> back home
          </Link>
          <Link
            href="/tools/applications"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Target className="h-3 w-3" aria-hidden /> applications tracker
          </Link>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-border bg-card/60">
              <Wand2 className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Resume Builder
              </h1>
              <p className="text-xs font-mono text-muted-foreground">
                Tailored by Gemini · ATS-tuned · saved automatically
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Paste a job description or drop a posting URL. Gemini extracts
            the ATS keywords, picks the most relevant projects and roles,
            and writes a tailored resume in my voice. Output streams as it
            generates.
          </p>
        </div>
      </BlurFade>

      {/* 01 — INPUT */}
      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <section className="flex flex-col gap-3">
          <StepHeader index="01" label="Job description" />
          <div className="rounded-lg border border-border bg-card/40 p-5 sm:p-6 flex flex-col gap-5">
            {/* URL row */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="job-url"
                className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
              >
                Posting URL (optional)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="job-url"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    disabled={fetchStatus === "fetching" || isBusy}
                    placeholder="https://jobs.example.com/postings/12345"
                    className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchFromUrl}
                  disabled={
                    fetchStatus === "fetching" || isBusy || !jobUrl.trim()
                  }
                >
                  {fetchStatus === "fetching" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Fetching
                    </>
                  ) : (
                    <>
                      <Link2 className="size-3.5" aria-hidden />
                      Fetch JD
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/80 italic">
                Works on most static postings (Greenhouse, Lever, company
                careers pages). LinkedIn and Workday may need a manual paste.
              </p>
            </div>

            <Separator />

            {/* JD textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="jd"
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
                >
                  Job description text
                </label>
                <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">
                  {jd.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                id="jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                disabled={isBusy}
                placeholder="Paste the full posting here, or fetch one with the URL field above. The more concrete the JD, the better the tailoring."
                rows={12}
                className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
              {/* JD red flags — advisory only. Doesn't block generation. */}
              {jdRedFlags.length > 0 && (
                <div className="rounded-md border border-amber-200/70 bg-amber-50/40 px-3 py-2 flex flex-col gap-1.5 dark:border-amber-900/40 dark:bg-amber-900/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="size-3" aria-hidden />
                    JD signals worth knowing ({jdRedFlags.length})
                  </div>
                  <ul className="flex flex-col gap-1 text-xs text-amber-900 dark:text-amber-200">
                    {jdRedFlags.map((flag, i) => (
                      <li key={i} className="flex flex-col gap-0">
                        <span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-700/80 dark:text-amber-400/80 mr-1.5">
                            {flag.category}
                          </span>
                          {flag.message}
                        </span>
                        {flag.snippet && (
                          <span className="font-mono text-[10px] text-amber-900/60 dark:text-amber-200/60 ml-1">
                            {flag.snippet}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={generate}
                disabled={isBusy}
                size="sm"
                className="min-w-[180px]"
              >
                {status === "streaming" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Generating...
                  </>
                ) : status === "retrying" ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" aria-hidden />
                    Retrying ({attemptNumber}/{MAX_AUTO_ATTEMPTS})...
                  </>
                ) : status === "checking" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Checking...
                  </>
                ) : status === "judging" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Judging...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" aria-hidden />
                    Generate tailored resume
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadLast}
                disabled={isBusy}
              >
                Load last JD
              </Button>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
          </div>
        </section>
      </BlurFade>

      {/* 02 — OUTPUT */}
      {(isBusy || output) && (
        <BlurFade delay={BLUR_FADE_DELAY * 4}>
          <section className="flex flex-col gap-3">
            <StepHeader
              index="02"
              label="Tailored resume"
              right={
                <StreamStatus
                  status={status}
                  attempt={attemptNumber}
                  max={MAX_AUTO_ATTEMPTS}
                />
              }
            />

            <div className="rounded-lg border border-border bg-card/40 p-5 sm:p-6 flex flex-col gap-5">
              {/* Retry banner */}
              {status === "retrying" && retryReason && (
                <RetryBanner reason={retryReason} />
              )}

              {/* Checks summary */}
              {checks && isSettled && (
                <ChecksPanel
                  result={checks}
                  status={status}
                  judgeRan={judgeRan}
                />
              )}

              {/* JD-match score */}
              {isSettled && matchScore && matchScore.totalKeywords > 0 && (
                <MatchScorePanel score={matchScore} />
              )}

              {/* META badges */}
              {(meta.company || meta.position) && (
                <div className="flex flex-wrap gap-2">
                  {meta.position && (
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] gap-1.5 py-1"
                    >
                      <Briefcase className="size-3" aria-hidden />
                      {meta.position}
                    </Badge>
                  )}
                  {meta.company && (
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] gap-1.5 py-1"
                    >
                      <Building2 className="size-3" aria-hidden />
                      {meta.company}
                    </Badge>
                  )}
                </div>
              )}

              {/* ATS keywords as chips. Missing-in-resume keywords are
                  rendered as outline with strikethrough so it's obvious
                  what the JD wants but the draft didn't include. */}
              {atsKeywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    ATS keywords ({atsKeywords.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsKeywords.map((kw, i) => {
                      const hit = matchScore?.hits.find(
                        (h) => h.keyword === kw,
                      );
                      const isMissing = hit && hit.count === 0;
                      return (
                        <Badge
                          key={`${kw}-${i}`}
                          variant={isMissing ? "outline" : "secondary"}
                          className={
                            isMissing
                              ? "font-normal text-xs line-through text-muted-foreground/60 border-dashed"
                              : "font-normal text-xs"
                          }
                          title={
                            hit
                              ? `appears ${hit.count}× in resume` +
                                (hit.inProminentSection
                                  ? " (in Summary/Skills)"
                                  : "")
                              : undefined
                          }
                        >
                          {kw}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {(meta.company ||
                meta.position ||
                atsKeywords.length > 0) &&
                resumeBody && <Separator />}

              {/* Resume body */}
              <div className="prose prose-sm max-w-full text-pretty font-sans leading-relaxed dark:prose-invert prose-headings:tracking-tight prose-h1:text-2xl prose-h1:mb-1 prose-h2:text-xs prose-h2:uppercase prose-h2:tracking-widest prose-h2:font-mono prose-h2:text-muted-foreground prose-h2:mt-6 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b prose-h2:border-border prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                <Markdown>
                  {resumeBody ||
                    (previewHasContent
                      ? ""
                      : "_Waiting for the first tokens..._")}
                </Markdown>
              </div>

              {/* Output actions */}
              {isSettled && (
                <>
                  <Separator />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy("resume")}
                    >
                      {copied === "resume" ? (
                        <>
                          <Check className="size-3.5" aria-hidden />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" aria-hidden />
                          Copy resume
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy("all")}
                    >
                      {copied === "all" ? (
                        <>
                          <Check className="size-3.5" aria-hidden />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" aria-hidden />
                          Copy keywords + resume
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={downloadDocx}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                          Rendering...
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" aria-hidden />
                          Download .docx
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadPdf}
                    >
                      <Printer className="size-3.5" aria-hidden />
                      Download .pdf
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateCoverLetter}
                      disabled={isClBusy}
                      title="Generate a tailored cover letter for the same JD"
                    >
                      {isClBusy ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                          Cover letter...
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3.5" aria-hidden />
                          Cover letter
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>
        </BlurFade>
      )}

      {/* 02b — COVER LETTER (visible after the user clicks the button) */}
      {(isClBusy || clOutput) && (
        <BlurFade delay={BLUR_FADE_DELAY * 4}>
          <section className="flex flex-col gap-3">
            <StepHeader
              index="02b"
              label="Cover letter"
              right={
                <StreamStatus
                  status={clStatus}
                  attempt={clAttemptNumber}
                  max={MAX_AUTO_ATTEMPTS}
                />
              }
            />
            <div className="rounded-lg border border-border bg-card/40 p-5 sm:p-6 flex flex-col gap-5">
              {clStatus === "retrying" && clRetryReason && (
                <RetryBanner reason={clRetryReason} />
              )}
              {clChecks && isClSettled && (
                <ChecksPanel
                  result={clChecks}
                  status={clStatus}
                  judgeRan={false}
                />
              )}
              {(clMeta.company || clMeta.position) && (
                <div className="flex flex-wrap gap-2">
                  {clMeta.position && (
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] gap-1.5 py-1"
                    >
                      <Briefcase className="size-3" aria-hidden />
                      {clMeta.position}
                    </Badge>
                  )}
                  {clMeta.company && (
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] gap-1.5 py-1"
                    >
                      <Building2 className="size-3" aria-hidden />
                      {clMeta.company}
                    </Badge>
                  )}
                </div>
              )}
              <div className="prose prose-sm max-w-full text-pretty font-sans leading-relaxed dark:prose-invert prose-p:my-2 whitespace-pre-line">
                <Markdown>
                  {clBody || "_Waiting for the first tokens..._"}
                </Markdown>
              </div>
              {isClSettled && (
                <>
                  <Separator />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyCoverLetter}
                    >
                      {clCopied ? (
                        <>
                          <Check className="size-3.5" aria-hidden />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" aria-hidden />
                          Copy cover letter
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={downloadCoverLetterDocx}
                      disabled={clDownloading}
                    >
                      {clDownloading ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                          Rendering...
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" aria-hidden />
                          Download .docx
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadCoverLetterPdf}
                    >
                      <Printer className="size-3.5" aria-hidden />
                      Download .pdf
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>
        </BlurFade>
      )}

      {/* 03 — HISTORY */}
      <BlurFade delay={BLUR_FADE_DELAY * 5}>
        <section className="flex flex-col gap-3">
          <StepHeader
            index="03"
            label="History"
            right={
              <div className="flex items-center gap-2">
                {historyLoading && (
                  <Loader2
                    className="size-3 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                )}
                {history.length > 0 && (
                  <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                    {history.length} saved
                  </span>
                )}
              </div>
            }
          />

          {history.length === 0 && !historyLoading ? (
            <div className="rounded-lg border border-dashed border-border bg-card/20 px-5 py-8 flex flex-col items-center gap-2 text-center">
              <FileText
                className="size-5 text-muted-foreground/60"
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">
                No saved resumes yet.
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-sm">
                Generated resumes save automatically once Vercel KV /
                Upstash env vars are set on the deployment.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card/20 overflow-hidden">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => loadFromHistory(item.id)}
                    disabled={isBusy}
                    className="flex flex-col items-start gap-1.5 text-left flex-1 min-w-0 disabled:opacity-60"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                        {formatDate(item.createdAt)}
                      </span>
                      {item.position && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] gap-1 py-0 px-1.5 h-5"
                        >
                          <Briefcase className="size-2.5" aria-hidden />
                          {item.position}
                        </Badge>
                      )}
                      {item.company && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] gap-1 py-0 px-1.5 h-5"
                        >
                          <Building2 className="size-2.5" aria-hidden />
                          {item.company}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-foreground line-clamp-2">
                      {item.jobDescriptionSnippet}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteFromHistory(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1.5 -mt-1 rounded-md hover:bg-destructive/5"
                    title="Delete this saved resume"
                    aria-label="Delete saved resume"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </BlurFade>
    </main>
  );
}

