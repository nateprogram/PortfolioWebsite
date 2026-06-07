"use client";

// The ATS keyword box. Paste a JD (or a job-posting URL), get back the
// keywords an ATS scans for, ranked by importance, each flagged with
// whether it's already in Nate's resume. The "missing" ones are what to
// weave into the resume before submitting.

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

type KeywordHit = { term: string; inResume: boolean };
type Mode = "text" | "url";

export function AtsKeywordsView() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<KeywordHit[] | null>(null);
  const [copied, setCopied] = useState<"all" | "missing" | null>(null);

  async function extract() {
    setLoading(true);
    setError(null);
    setKeywords(null);
    try {
      const payload =
        mode === "text" ? { text: text.trim() } : { url: url.trim() };
      const res = await fetch("/api/applications/ats-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        keywords?: KeywordHit[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setKeywords(data.keywords ?? []);
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  function copy(which: "all" | "missing") {
    if (!keywords) return;
    const list =
      which === "missing" ? keywords.filter((k) => !k.inResume) : keywords;
    const out = list.map((k) => k.term).join(", ");
    void navigator.clipboard.writeText(out);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  const canSubmit =
    !loading && (mode === "text" ? text.trim().length > 0 : url.trim().length > 0);
  const missing = keywords?.filter((k) => !k.inResume) ?? [];
  const present = keywords?.filter((k) => k.inResume) ?? [];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        <Sparkles className="size-3" aria-hidden />
        ATS keyword extractor
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1.5 text-xs font-mono">
        <ModeChip active={mode === "text"} onClick={() => setMode("text")}>
          Paste JD
        </ModeChip>
        <ModeChip active={mode === "url"} onClick={() => setMode("url")}>
          From URL
        </ModeChip>
      </div>

      {/* Input */}
      {mode === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={6}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://jobs.example.com/postings/12345"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={extract}
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" aria-hidden />
              Extract keywords
            </>
          )}
        </button>
        {mode === "url" && (
          <span className="text-xs text-muted-foreground">
            Works on most static postings; Workday/LinkedIn may need paste.
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {keywords && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
            <span>
              {keywords.length} keywords ·{" "}
              <span className="text-amber-700 dark:text-amber-400">
                {missing.length} missing from your resume
              </span>
            </span>
            <div className="flex gap-1.5 ml-auto">
              <CopyBtn
                onClick={() => copy("missing")}
                copied={copied === "missing"}
                disabled={missing.length === 0}
              >
                Copy missing
              </CopyBtn>
              <CopyBtn onClick={() => copy("all")} copied={copied === "all"}>
                Copy all
              </CopyBtn>
            </div>
          </div>

          {/* Missing first — that's the actionable set */}
          {missing.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Missing — consider adding these
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((k) => (
                  <span
                    key={k.term}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    <X className="size-3" aria-hidden />
                    {k.term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Already present */}
          {present.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Already in your resume
              </span>
              <div className="flex flex-wrap gap-1.5">
                {present.map((k) => (
                  <span
                    key={k.term}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                  >
                    <Check className="size-3" aria-hidden />
                    {k.term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md border transition-colors ${
        active
          ? "border-foreground/30 bg-foreground/5 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/30"
      }`}
    >
      {children}
    </button>
  );
}

function CopyBtn({
  onClick,
  copied,
  disabled,
  children,
}: {
  onClick: () => void;
  copied: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted/30 transition-colors disabled:opacity-50"
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
      {copied ? "Copied" : children}
    </button>
  );
}
