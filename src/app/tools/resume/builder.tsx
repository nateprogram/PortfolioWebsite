"use client";

// The unlocked-state UI for /tools/resume.
//
// Form: paste a JD → POST /api/resume → stream Gemini's markdown back.
// Output renders progressively. The client runs `checkResume` against
// the streamed markdown; if hard fails are detected, it auto-retries
// (up to MAX_AUTO_ATTEMPTS) by re-POSTing with retry context. The
// model gets the previous attempt + the specific failures as fix
// feedback. After the retry loop settles, the best attempt is POSTed
// to /api/resume/save to persist it.
// The .docx renderer is lazy-loaded so its ~200KB footprint isn't in
// the main bundle.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Link2,
  Loader2,
  RotateCw,
  Sparkles,
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
} from "@/lib/resume-checks";

const BLUR_FADE_DELAY = 0.04;
const STORAGE_KEY = "tools/resume:last-jd";
const MAX_AUTO_ATTEMPTS = 3;

type Status =
  | "idle"
  | "streaming" // first attempt streaming
  | "checking" // brief gap while running heuristics
  | "judging" // running the Groq / Llama cross-reference critic
  | "retrying" // retry attempt streaming
  | "done" // accepted (passed checks + judge cleanly)
  | "warning" // finished retries but residual hard fails — manual review
  | "error";
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
      setStatus("done");
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
        "@/lib/markdown-to-docx"
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

  // Memoize the chunks the output card needs so each keystroke during
  // streaming doesn't re-run the regex parsers from scratch.
  const meta = useMemo(() => parseMeta(output), [output]);
  const atsKeywords = useMemo(() => parseAtsKeywords(output), [output]);
  const resumeBody = useMemo(() => extractResume(output), [output]);
  const previewHasContent = Boolean(
    meta.company || meta.position || atsKeywords.length > 0 || resumeBody,
  );
  // True while the retry chain is in flight. Disables input controls so
  // the user can't kick off a second generation mid-loop.
  const isBusy =
    status === "streaming" ||
    status === "retrying" ||
    status === "checking" ||
    status === "judging";
  // True once the chain has settled (passed or exhausted retries). Output
  // actions and resume preview gating use this.
  const isSettled = status === "done" || status === "warning";

  return (
    <main className="min-h-dvh flex flex-col gap-10">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden /> back home
        </Link>
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

              {/* ATS keywords as chips */}
              {atsKeywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    ATS keywords ({atsKeywords.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsKeywords.map((kw, i) => (
                      <Badge
                        key={`${kw}-${i}`}
                        variant="secondary"
                        className="font-normal text-xs"
                      >
                        {kw}
                      </Badge>
                    ))}
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

// ----- internal sub-components ---------------------------------------------

function StepHeader({
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

function StreamStatus({
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

function RetryBanner({ reason }: { reason: string }) {
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

function ChecksPanel({
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

  // After exhausted retries with residual hard fails — surface for manual fix.
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
  // Cleanly passed but with soft warnings.
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
  // Cleanly passed, no warnings — keep visual clutter minimal.
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

function isJudgeIssue(issue: CheckIssue): boolean {
  return issue.id.startsWith("judge:");
}

function IssueRow({
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

/**
 * Pull just the resume body out of the combined output. The model puts
 * an optional META block first, then ATS keywords, then `---`, then the
 * resume itself.
 */
function extractResume(combined: string): string {
  const lines = combined.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      return lines.slice(i + 1).join("\n").trimStart();
    }
  }
  return combined;
}

/**
 * Remove the `[META] ... [/META]` block from a string before showing it
 * to the user. Tolerant of partial streams: if `[/META]` hasn't arrived
 * yet, hides everything from `[META]` to the end of the buffer rather
 * than leaking the half-formed block into the preview.
 */
function stripMetaForDisplay(s: string): string {
  if (!s) return s;
  const start = s.indexOf("[META]");
  if (start === -1) return s;
  const end = s.indexOf("[/META]", start);
  if (end === -1) return s.slice(0, start).trimEnd();
  const after = s.slice(end + "[/META]".length);
  return (s.slice(0, start) + after).replace(/^\s+/, "");
}

/**
 * Pull the ATS-keyword bullet list out of the model's output. The model
 * emits a `## ATS Keywords` heading followed by `- foo`-style bullets,
 * then a horizontal rule `---`, then the resume body. We grab the bullet
 * text only (no leading dash, trimmed) so the UI can render them as
 * chips instead of a markdown list.
 *
 * Returns `[]` while the keywords section hasn't streamed yet, or when
 * the model omits it entirely.
 */
function parseAtsKeywords(output: string): string[] {
  if (!output) return [];
  // Find the start of the ATS Keywords section.
  const headingMatch = /^##\s+ATS\s+Keywords\s*$/im.exec(output);
  if (!headingMatch) return [];
  const start = headingMatch.index + headingMatch[0].length;
  // The section ends at the first `---` rule (which separates Keywords
  // from the resume body). If `---` hasn't arrived yet, scan to end.
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

/**
 * Parse the META block emitted by the model. Returns `company` and
 * `position` strings if found. Whitespace-tolerant. Both fields are
 * optional — callers should fall back gracefully if either is missing.
 */
function parseMeta(s: string): { company?: string; position?: string } {
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

/**
 * Sanitize a string for use inside a filename. Drops path separators,
 * Windows-reserved characters, and control chars; collapses runs of
 * spaces to single underscores; trims to a reasonable length.
 */
function sanitizeFilenamePart(s: string): string {
  return s
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 60);
}

/**
 * Fold judge issues into an existing CheckResult, regenerate retryNotes
 * so the retry prompt to Gemini includes both heuristic and judge
 * findings. The judge's `hardFails` are appended to the heuristic
 * hardFails; soft to soft. Pass/fail recomputes from the combined
 * hardFails count.
 */
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

/**
 * Build the .docx filename from the model's META block. Prefers
 * position + company; falls back to a date stamp if META is missing.
 */
function buildDownloadFilename(output: string): string {
  const { company, position } = parseMeta(output);
  const parts = ["Nate_White"];
  if (position) parts.push(sanitizeFilenamePart(position));
  if (company) parts.push(sanitizeFilenamePart(company));
  if (parts.length === 1) {
    // No META — fall back to a dated name so files don't collide.
    parts.push("Resume", new Date().toISOString().slice(0, 10));
  }
  return parts.filter(Boolean).join("_") + ".docx";
}

/** Compact date format for history rows. */
function formatDate(ms: number): string {
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
