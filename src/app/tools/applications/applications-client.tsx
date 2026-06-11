"use client";

// Client shell for /tools/applications. Two things, nothing more:
//   1. ATS keyword box  — paste a JD/URL, see keywords + what's missing
//      from the resume.
//   2. Gmail-fed spreadsheet — every job the Gmail scan has tracked,
//      sortable/searchable, with inline status fixes, delete, CSV export.
//
// Applications are created by the Gmail ingest pipeline, not here, so this
// component only reads (GET), patches (status fixes), and deletes.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileCode2,
  Loader2,
  RefreshCw,
  Target,
  Trash2,
} from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import type { Application } from "@/lib/applications-store";
import { AtsKeywordsView } from "./ats-keywords-view";
import { SpreadsheetView } from "./spreadsheet-view";

const BLUR_FADE_DELAY = 0.04;

export function ApplicationsClient() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: Application[] };
      setApps(data.items ?? []);
    } catch {
      // empty-state handles it
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, patch: Partial<Application>) {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
      ),
    );
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) await refresh();
    } catch {
      await refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this row? If it came from Gmail, the next scan re-adds it unless you label the thread JobTracker/Ignored.")) {
      return;
    }
    const prev = apps;
    setApps((p) => p.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) setApps(prev);
    } catch {
      setApps(prev);
    }
  }

  async function wipeAll() {
    if (
      !confirm(
        `Delete ALL ${apps.length} tracked applications and their indexes?\n\nUse this for a clean rebuild: after wiping, run resetBackfill + scanInbox in the Apps Script and the tracker rebuilds from scratch with current dedup. This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/applications/wipe", { method: "POST" });
      if (res.ok) {
        setApps([]);
        await refresh();
      }
    } catch {
      // leave as-is; user can retry
    }
  }

  return (
    <main className="min-h-dvh flex flex-col gap-8">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden /> back home
          </Link>
          {/* Quiet link to the Gmail-scanner Apps Script that feeds this
              tracker. Rarely needed, but when it is (resetBackfill, prompt
              tweaks, quota errors) hunting for the URL is annoying. */}
          <a
            href="https://script.google.com/u/2/home/projects/1tBJKkaDQPPqLM1nTdYwRa7TsZsSzUxjNNI_huaFIbnjxrEoqaIGF6RRA/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60 hover:text-foreground transition-colors"
            title="Open the Gmail scanner script in Apps Script"
          >
            <FileCode2 className="h-3 w-3" aria-hidden />
            email script
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-card/60">
            <Target className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Job Tracker
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              ATS keywords + a Gmail-fed application spreadsheet
            </p>
          </div>
        </div>
      </BlurFade>

      {/* Spreadsheet — the PRIMARY view, so it comes first. Breaks out of the
          page's max-w-2xl column to a wider, viewport-centered block on desktop
          (capped at 100vw-3rem so it never introduces horizontal page scroll).
          On mobile it equals the normal column width. */}
      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <div className="flex flex-col gap-3 relative left-1/2 -translate-x-1/2 w-[min(64rem,100vw-3rem)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Applications
            </h2>
            <div className="flex items-center gap-3">
              {apps.length > 0 && (
                <button
                  type="button"
                  onClick={wipeAll}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/70 hover:text-destructive transition-colors"
                  title="Delete all rows for a clean rebuild"
                >
                  <Trash2 className="size-3" aria-hidden />
                  Wipe all
                </button>
              )}
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw
                  className={`size-3 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </button>
            </div>
          </div>
          {loading && apps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/20 px-5 py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading applications...
            </div>
          ) : (
            <SpreadsheetView apps={apps} onPatch={patch} onDelete={remove} />
          )}
        </div>
      </BlurFade>

      {/* ATS keyword box — secondary utility, sits below the tracker. */}
      <BlurFade delay={BLUR_FADE_DELAY * 4}>
        <AtsKeywordsView />
      </BlurFade>
    </main>
  );
}
