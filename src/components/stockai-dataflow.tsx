"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ArrowDown,
  Database,
  Activity,
  Brain,
  ShieldCheck,
  Terminal,
  Waypoints,
  TrendingUp,
  RefreshCw,
  LineChart,
  Network,
  Radio,
  Cpu,
  BarChart3,
} from "lucide-react";

// V6 data flow as an interactive HTML component. This replaces the older
// fixed-size SVG diagram: because every visible element here uses the
// site's semantic color tokens (`text-foreground`, `text-muted-foreground`,
// `bg-card`, `border-border`, etc.), the same markup reads cleanly in
// both light and dark mode — no more grey-on-white unreadability. Every
// major stage is a click-to-expand card so readers can drill into the
// details that used to be stuffed inline as tiny monospace captions.

type Accent = "default" | "model" | "feedback" | "db" | "gate";

// Soft-tinted surfaces. Opacities are kept low so the accent is
// perceivable but doesn't dominate at either color scheme — e.g. a sky
// wash on light-mode white reads as "lightly blue" rather than "blue
// button".
const ACCENT_CLASSES: Record<Accent, string> = {
  default:
    "border-border bg-card/40 hover:bg-card/70 hover:border-border/80",
  model:
    "border-cyan-500/30 bg-cyan-500/[0.05] hover:bg-cyan-500/[0.10] hover:border-cyan-500/50",
  feedback:
    "border-amber-500/40 bg-amber-500/[0.06] hover:bg-amber-500/[0.10] hover:border-amber-500/60",
  db:
    "border-slate-400/30 bg-slate-500/[0.05] hover:bg-slate-500/[0.10] hover:border-slate-400/50",
  gate:
    "border-emerald-500/30 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.10] hover:border-emerald-500/50",
};

const ICON_ACCENT: Record<Accent, string> = {
  default: "text-muted-foreground/80",
  model: "text-cyan-600 dark:text-cyan-400",
  feedback: "text-amber-600 dark:text-amber-400",
  db: "text-slate-600 dark:text-slate-300",
  gate: "text-emerald-600 dark:text-emerald-400",
};

function FlowNode({
  title,
  tagline,
  accent = "default",
  icon,
  details,
  defaultOpen = false,
  compact = false,
}: {
  title: string;
  tagline?: string;
  accent?: Accent;
  icon?: React.ReactNode;
  details?: ReadonlyArray<string>;
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetails = (details?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        ACCENT_CLASSES[accent]
      )}
    >
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        aria-expanded={hasDetails ? open : undefined}
        disabled={!hasDetails}
        className={cn(
          "group flex w-full items-start gap-2.5 text-left",
          compact ? "px-2.5 py-2" : "px-3 py-2.5",
          hasDetails ? "cursor-pointer" : "cursor-default"
        )}
      >
        {icon && (
          <div className={cn("mt-[3px] shrink-0", ICON_ACCENT[accent])}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "font-mono font-semibold uppercase tracking-widest text-foreground",
                compact ? "text-[10px]" : "text-[11px]"
              )}
            >
              {title}
            </span>
            {hasDetails && (
              <ChevronDown
                className={cn(
                  "size-3 shrink-0 text-muted-foreground/50 transition-transform",
                  open && "rotate-180",
                  "group-hover:text-muted-foreground"
                )}
                aria-hidden
              />
            )}
          </div>
          {tagline && (
            <div
              className={cn(
                "mt-1 leading-snug text-muted-foreground",
                compact ? "text-[11px]" : "text-xs"
              )}
            >
              {tagline}
            </div>
          )}
        </div>
      </button>
      {hasDetails && open && (
        <ul className="border-t border-border/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {details!.map((d, i) => (
            <li key={i} className="flex gap-2 py-0.5">
              <span className="shrink-0 text-muted-foreground/50">•</span>
              <span className="min-w-0 flex-1">{d}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VerticalArrow({
  label,
  accent = "default",
}: {
  label?: string;
  accent?: "default" | "model" | "feedback";
}) {
  const styles = {
    default: { line: "bg-border", icon: "text-muted-foreground/60" },
    model: {
      line: "bg-cyan-500/40",
      icon: "text-cyan-600 dark:text-cyan-400",
    },
    feedback: {
      line: "bg-amber-500/50",
      icon: "text-amber-600 dark:text-amber-400",
    },
  }[accent];

  return (
    <div
      className="flex flex-col items-center gap-0.5 py-1"
      aria-hidden
    >
      <div className={cn("h-4 w-px", styles.line)} />
      <ArrowDown className={cn("size-3", styles.icon)} strokeWidth={2.5} />
      {label && (
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
          {label}
        </span>
      )}
    </div>
  );
}

// ---------- Content data (kept outside JSX so the component body stays
// readable and so this block is easy to diff when the pipeline changes) ----------

const SCRAPER_CATEGORIES: ReadonlyArray<{
  title: string;
  count: number;
  items: ReadonlyArray<string>;
  icon: React.ReactNode;
}> = [
  {
    title: "Price / Volume",
    count: 5,
    items: ["Price", "Volume", "Bid / Ask", "Order Book", "Technicals"],
    icon: <LineChart className="size-3.5" />,
  },
  {
    title: "Market Context",
    count: 7,
    items: [
      "SPY / Market",
      "VIX",
      "Sectors",
      "Futures",
      "International",
      "Market Internals",
      "Short Interest",
    ],
    icon: <Activity className="size-3.5" />,
  },
  {
    title: "Social / News",
    count: 5,
    items: [
      "Reddit",
      "StockTwits",
      "Twitter",
      "News Feed",
      "News Sentiment",
    ],
    icon: <Radio className="size-3.5" />,
  },
  {
    title: "Institutional",
    count: 4,
    items: ["Options Flow", "Dark Pools", "Insiders", "Political Trades"],
    icon: <Waypoints className="size-3.5" />,
  },
  {
    title: "Economic / Alt",
    count: 2,
    items: ["Economic Indicators", "Economic Calendar"],
    icon: <Cpu className="size-3.5" />,
  },
];

export function StockaiDataflow({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col", className)}
      role="region"
      aria-label="V6 data flow — interactive architecture diagram. Click any stage to expand its details."
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

      {/* Row 1: Scraper categories (peers, no cross-talk between them) */}
      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
        23 scrapers · 5 peer categories
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {SCRAPER_CATEGORIES.map((c) => (
          <FlowNode
            key={c.title}
            title={c.title}
            tagline={`${c.count} scrapers`}
            details={c.items}
            icon={c.icon}
            compact
          />
        ))}
      </div>

      <VerticalArrow label="raw streams" />

      {/* Two-column split: main pipeline (left) + DB / feedback column (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* ========================= Main pipeline ========================= */}
        <div className="flex flex-col">
          <FlowNode
            title="Working Data Controller"
            tagline="Collects from all 23 scrapers · market-hours aware · rate-limit + retry · async"
            icon={<Network className="size-3.5" />}
            details={[
              "Per-source refresh cadences span 50 ms → 24 h",
              "Exponential-backoff retries on any failure",
              "Market-hours-aware scheduling",
              "Writes the freshest tick state to the DB hot tier",
            ]}
          />
          <VerticalArrow />

          <FlowNode
            title="Feature Engine · 148 features"
            tagline="Volatility cones · regime-adjusted momentum · cross-asset deltas"
            accent="model"
            icon={<Cpu className="size-3.5" />}
            details={[
              "Sentiment z-scores per ticker",
              "Microstructure features: bid/ask pressure, order-book imbalance",
              "Lagged macro indicators",
              "Correlation-based pruning drops redundant features",
            ]}
          />
          <VerticalArrow />

          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
            Three analyzers in parallel
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FlowNode
              title="Order Flow"
              tagline="price · volume · bid/ask pressure"
              details={[
                "Order-book imbalance features",
                "Short-horizon price velocity",
              ]}
              compact
            />
            <FlowNode
              title="Sentiment"
              tagline="reddit · stocktwits · twitter · news"
              details={[
                "Z-scored per ticker to kill hype baselines",
                "Source-weighted by historical predictive value",
              ]}
              compact
            />
            <FlowNode
              title="Smart Money"
              tagline="options flow · dark pools · insiders · political"
              details={[
                "Unusual-options-volume detection",
                "Insider-cluster and politician-trade overlays",
              ]}
              compact
            />
          </div>
          <VerticalArrow />

          <FlowNode
            title="Correlation Analyzer"
            tagline="SPY / VIX / sectors / international cross-reads"
            icon={<Network className="size-3.5" />}
          />
          <VerticalArrow />

          <FlowNode
            title="Signal Aggregator"
            tagline="Consensus scoring · conflict detection · confidence · horizon weighting"
            icon={<Waypoints className="size-3.5" />}
            details={[
              "Per-analyzer confidence gets horizon-weighted before fusion",
              "Conflicting signals surface explicitly instead of being averaged away",
            ]}
          />
          <VerticalArrow />

          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
            Regime detection → predictor
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
            <FlowNode
              title="HMM Regime"
              tagline="hmmlearn over returns + realized vol"
              icon={<Activity className="size-3.5" />}
              details={[
                "Bull-trending",
                "Bear-trending",
                "High-vol chop",
                "Low-vol grind",
              ]}
              compact
            />
            <FlowNode
              title="MultiHeadLSTM Predictor"
              tagline="Shared encoder · 10 per-horizon heads · horizons span minutes → weeks"
              accent="model"
              icon={<Brain className="size-3.5" />}
              details={[
                "Closed-loop feature attention keeps predictions tied to live inputs",
                "EMA smoothing α = 0.15 with clipping to [0.5, 2.0]",
                "One shared encoder feeds every horizon head",
              ]}
              defaultOpen
            />
          </div>
          <VerticalArrow accent="model" />

          <FlowNode
            title="6-Check Prediction Validator"
            tagline="direction · magnitude · confidence · regime fit · horizon coherence · drift"
            icon={<ShieldCheck className="size-3.5" />}
            accent="gate"
            details={[
              "Every forecast must pass all six checks before publication",
              "Failures are logged with the offending axis so drift is visible",
            ]}
          />
          <VerticalArrow />

          <FlowNode
            title="FastAPI + WebSocket Dashboard"
            tagline="Streaming predictions · attention weights · regime label · validator stats"
            icon={<Terminal className="size-3.5" />}
            details={[
              "REST surface for batch backtests",
              "WebSocket push for live, low-latency dashboard updates",
            ]}
          />
        </div>

        {/* ================== Right column: DB + feedback loop ================= */}
        <aside className="flex flex-col gap-3">
          <FlowNode
            title="Database Layer"
            tagline="3-tier: SQLite (hot) · Parquet (warm) · archive (cold)"
            accent="db"
            icon={<Database className="size-3.5" />}
            defaultOpen
            details={[
              "Historical data — bars / ticks / macro",
              "Predictions — OOF + live forecasts",
              "Training checkpoints — incumbent + candidates",
              "Watchlist — user-managed symbols",
            ]}
          />

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.04] p-2.5">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <RefreshCw className="size-3" strokeWidth={2.5} aria-hidden />
              retrain &amp; rollback loop
            </div>

            <div className="flex flex-col gap-2">
              <FlowNode
                title="Continuous Learner"
                tagline="Weekly retrain on a rolling window"
                accent="feedback"
                icon={<RefreshCw className="size-3.5" />}
                details={[
                  "Writes candidate checkpoint to the DB",
                  "Requests promotion from the backtester",
                ]}
              />
              <FlowNode
                title="Purged K-Fold Backtester"
                tagline="Embargo windows · regime-stratified folds"
                accent="feedback"
                icon={<BarChart3 className="size-3.5" />}
                details={[
                  "Deploy gate — candidate must beat the incumbent on BOTH:",
                  "direction accuracy",
                  "worst-regime Sharpe",
                ]}
              />
            </div>

            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <TrendingUp className="size-3" strokeWidth={2.5} aria-hidden />
              promoted checkpoint → predictor
            </div>
          </div>

          {/* Compact legend — keeps the same semantic cues the old SVG
              communicated with dashed / solid / colored arrows. */}
          <div className="rounded-lg border border-border/60 bg-card/30 p-2.5">
            <div className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/80">
              Legend
            </div>
            <ul className="flex flex-col gap-1 text-[11px]">
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-sm bg-cyan-500/60" />
                <span className="text-muted-foreground">Model path</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-sm bg-amber-500/70" />
                <span className="text-muted-foreground">
                  Retrain / rollback loop
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-sm bg-emerald-500/60" />
                <span className="text-muted-foreground">
                  Deploy-gate validator
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-sm bg-slate-500/60" />
                <span className="text-muted-foreground">Database layer</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
