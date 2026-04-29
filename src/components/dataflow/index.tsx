"use client";

import { useRef } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AGGREGATOR,
  ANALYZERS,
  BACKTESTER,
  CONTROLLER,
  CORRELATION,
  DASHBOARD,
  DATABASE,
  FEATURE_ENGINE,
  HMM,
  LEARNER,
  LEGEND_ITEMS,
  LSTM,
  SCRAPER_CATEGORIES,
  VALIDATOR,
} from "./data";
import { FeedbackArrow } from "./feedback-arrow";
import { FlowNode, ScraperCard, VerticalArrow } from "./nodes";

// Composition root for the V6 data-flow diagram.
//
// Structure:
//   1. Header + caption
//   2. Row 1: five ScraperCards (static, all sources visible)
//   3. Row 2+: left column (main pipeline) and right column (DB + retrain
//      loop). The right column's promoted-checkpoint chip is tied to the
//      LSTM predictor by a measured SVG curve (FeedbackArrow) so the
//      yellow retrain-loop visual from the original diagram is preserved
//      without pinning any layout to hardcoded pixel coordinates.
//
// The whole region is `position: relative` so the absolutely-positioned
// SVG overlay shares its coordinate system.

export function StockaiDataflow({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lstmRef = useRef<HTMLDivElement>(null);
  const feedbackSourceRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col", className)}
      role="region"
      aria-label="V6 data flow: interactive architecture diagram. Click any stage to expand its details."
    >
      {/* Header */}
      <div className="mb-4 border-b border-border/60 pb-3">
        <div className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
          V6 Data Flow
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          23 scrapers · 148 features · 10-head LSTM ·{" "}
          <span className="text-foreground/80">
            click any stage to expand
          </span>
        </div>
      </div>

      {/* ========================= Row 1: Scraper categories ====================
          Five peer categories, each rendered as a static ScraperCard so the
          sources are visible at a glance. There is no per-card expand: the
          distinguishing info *is* the source list, so hiding it behind a
          click added friction without adding information. */}
      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
        23 scrapers · 5 peer categories
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {SCRAPER_CATEGORIES.map((c) => (
          <ScraperCard
            key={c.title}
            title={c.title}
            count={c.count}
            items={c.items}
            icon={c.icon}
          />
        ))}
      </div>

      <VerticalArrow label="raw streams" />

      {/* Two-column split: main pipeline (left) + DB / feedback column (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* ========================= Main pipeline (left) ======================= */}
        <div className="flex flex-col">
          <FlowNode {...CONTROLLER} />
          <VerticalArrow />

          <FlowNode {...FEATURE_ENGINE} />
          <VerticalArrow accent="model" />

          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
            Three analyzers in parallel
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ANALYZERS.map((a) => (
              <FlowNode key={a.title} {...a} compact />
            ))}
          </div>
          <VerticalArrow />

          <FlowNode {...CORRELATION} />
          <VerticalArrow />

          <FlowNode {...AGGREGATOR} />
          <VerticalArrow />

          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
            Regime detection → predictor
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
            <FlowNode {...HMM} compact />
            {/* Wrapper div carries the ref for the feedback arrow's
                endpoint. Keeping the ref on a wrapper (rather than
                forwarding through FlowNode) isolates layout concerns
                from the card primitive. */}
            <div ref={lstmRef}>
              <FlowNode {...LSTM} />
            </div>
          </div>
          <VerticalArrow accent="model" />

          <FlowNode {...VALIDATOR} />
          <VerticalArrow />

          <FlowNode {...DASHBOARD} />
        </div>

        {/* ================== Right column: DB + feedback loop ================= */}
        <aside className="flex flex-col gap-3">
          <FlowNode {...DATABASE} />

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.04] p-2.5">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <RefreshCw className="size-3" strokeWidth={2.5} aria-hidden />
              retrain &amp; rollback loop
            </div>

            <div className="flex flex-col gap-2">
              <FlowNode {...LEARNER} />
              <FlowNode {...BACKTESTER} />
            </div>

            {/* Promoted-checkpoint chip: the FeedbackArrow's
                source endpoint. The measured SVG curve leaves from the
                top of this chip and sweeps over to the LSTM predictor. */}
            <div
              ref={feedbackSourceRef}
              className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-amber-700 dark:text-amber-400"
            >
              <TrendingUp className="size-3" strokeWidth={2.5} aria-hidden />
              promoted checkpoint → predictor
            </div>
          </div>

          {/* Legend: restores the semantic color cues the original SVG
              communicated with dashed / solid / colored arrows. */}
          <div className="rounded-lg border border-border/60 bg-card/30 p-2.5">
            <div className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/80">
              Legend
            </div>
            <ul className="flex flex-col gap-1 text-[11px]">
              {LEGEND_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-sm", item.swatch)} />
                  <span className="text-muted-foreground">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Measured SVG overlay drawing the amber retrain-loop arrow from
          the promoted-checkpoint chip up and across to the LSTM
          predictor. Rendered last so it stacks above the cards. */}
      <FeedbackArrow
        containerRef={containerRef}
        fromRef={feedbackSourceRef}
        toRef={lstmRef}
      />
    </div>
  );
}
