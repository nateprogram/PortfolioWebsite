"use client";

// The unlocked-state UI for /tools/resume.
//
// Form: paste a JD → POST /api/resume → stream Gemini's markdown back.
// Output renders progressively. After the stream closes the row is
// auto-saved server-side, the history list refreshes, and three actions
// appear: Copy resume, Copy keywords + resume, Download as .docx.
// The .docx renderer is lazy-loaded so its ~200KB footprint isn't in
// the main bundle.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Trash2, Wand2 } from "lucide-react";
import Markdown from "react-markdown";
import BlurFade from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";

const BLUR_FADE_DELAY = 0.04;
const STORAGE_KEY = "tools/resume:last-jd";

type Status = "idle" | "streaming" | "done" | "error";

type HistoryItem = {
  id: string;
  createdAt: number;
  jobDescriptionSnippet: string;
};

export function Builder() {
  const [jd, setJd] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<"resume" | "all" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

    setStatus("streaming");
    setErrorMessage(null);
    setOutput("");

    let res: Response;
    try {
      res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: trimmed }),
      });
    } catch (err) {
      setErrorMessage(`Network error: ${(err as Error).message}`);
      setStatus("error");
      return;
    }

    if (!res.ok || !res.body) {
      let message = `Request failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // body wasn't JSON; keep status-based message
      }
      setErrorMessage(message);
      setStatus("error");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }
      accumulated += decoder.decode();
      setOutput(accumulated);
      setStatus("done");
      // Server saves automatically after the stream closes; give it a
      // beat then refresh the history list so the new row appears.
      setTimeout(() => void refreshHistory(), 600);
    } catch (err) {
      setErrorMessage(`Stream error: ${(err as Error).message}`);
      setStatus("error");
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
    const text = which === "resume" ? extractResume(output) : output;
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
      a.download = `Nate_White_Resume_${new Date().toISOString().slice(0, 10)}.docx`;
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

  return (
    <main className="min-h-dvh flex flex-col gap-8">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden /> back home
        </Link>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Wand2 className="size-7 text-muted-foreground" aria-hidden />
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Resume Builder
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Paste a job description. Gemini extracts the ATS keywords, picks
            the most relevant projects and roles, and writes a tailored
            resume in my voice. Output streams as it generates and saves
            automatically.
          </p>
        </div>
      </BlurFade>

      {/* JD form */}
      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <div className="flex flex-col gap-3">
          <label
            htmlFor="jd"
            className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
          >
            Job description
          </label>
          <textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            disabled={status === "streaming"}
            placeholder="Paste the full posting here. The more concrete the JD, the better the tailoring."
            rows={12}
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={generate}
              disabled={status === "streaming"}
              size="sm"
            >
              {status === "streaming" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Generating...
                </>
              ) : (
                "Generate tailored resume"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadLast}
              disabled={status === "streaming"}
            >
              Load last JD
            </Button>
            {status === "done" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copy("resume")}
                >
                  {copied === "resume" ? "Copied" : "Copy resume only"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copy("all")}
                >
                  {copied === "all" ? "Copied" : "Copy keywords + resume"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadDocx}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" aria-hidden />
                      Download .docx
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
      </BlurFade>

      {/* Output */}
      {(status === "streaming" || output) && (
        <BlurFade delay={BLUR_FADE_DELAY * 4}>
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Output
            </div>
            <div className="rounded-md border border-border bg-card/40 p-5 sm:p-6">
              <div className="prose prose-sm max-w-full text-pretty font-sans leading-relaxed dark:prose-invert">
                <Markdown>
                  {output || "_Waiting for the first tokens..._"}
                </Markdown>
              </div>
            </div>
          </div>
        </BlurFade>
      )}

      {/* History */}
      <BlurFade delay={BLUR_FADE_DELAY * 5}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              History {history.length > 0 && `(${history.length})`}
            </div>
            {historyLoading && (
              <Loader2
                className="size-3 animate-spin text-muted-foreground"
                aria-hidden
              />
            )}
          </div>
          {history.length === 0 && !historyLoading && (
            <p className="text-xs text-muted-foreground italic">
              No saved resumes yet. Generations are saved automatically once
              KV storage is configured (see /api/resume route comments).
            </p>
          )}
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => loadFromHistory(item.id)}
                  disabled={status === "streaming"}
                  className="flex flex-col items-start gap-1 text-left flex-1 min-w-0 disabled:opacity-60"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </span>
                  <span className="text-sm text-foreground line-clamp-2">
                    {item.jobDescriptionSnippet}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void deleteFromHistory(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 -mt-1"
                  title="Delete this saved resume"
                  aria-label="Delete saved resume"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </BlurFade>
    </main>
  );
}

/**
 * Pull just the resume body out of the combined output. The model puts
 * ATS keywords first, then `---`, then the resume.
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
