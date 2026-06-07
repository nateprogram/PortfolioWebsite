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
import { ArrowLeft, Loader2, RefreshCw, Target } from "lucide-react";
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

      {/* ATS keyword box */}
      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <AtsKeywordsView />
      </BlurFade>

      {/* Spreadsheet */}
      <BlurFade delay={BLUR_FADE_DELAY * 4}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Applications
            </h2>
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
    </main>
  );
}
