import {
  Activity,
  BarChart3,
  Brain,
  Cpu,
  Database,
  LineChart,
  Network,
  Radio,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Waypoints,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Accent } from "./tokens";

// All pipeline content lives here so the composition file reads as pure
// layout. Tweak wording, counts or icons in this one file and the diagram
// updates everywhere.

// ---------------------------------------------------------------------------
// Scraper categories (row 1)
// ---------------------------------------------------------------------------
// Rendered as a row of ScraperCards — each card is static (items always
// visible) rather than individually expandable. The per-card expand in the
// previous version was confusing because the grid forced every peer to
// stretch when one expanded, and every card's job is identical (scrape) —
// only the listed sources differ.

export type ScraperCategory = {
  title: string;
  count: number;
  items: ReadonlyArray<string>;
  icon: ReactNode;
};

export const SCRAPER_CATEGORIES: ReadonlyArray<ScraperCategory> = [
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
    items: ["Reddit", "StockTwits", "Twitter", "News Feed", "News Sentiment"],
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

// ---------------------------------------------------------------------------
// Main pipeline stages (left column, top to bottom)
// ---------------------------------------------------------------------------

export type PipelineStage = {
  title: string;
  tagline?: string;
  accent?: Accent;
  icon?: ReactNode;
  details?: ReadonlyArray<string>;
  defaultOpen?: boolean;
};

export const CONTROLLER: PipelineStage = {
  title: "Working Data Controller",
  tagline:
    "Collects from all 23 scrapers · market-hours aware · rate-limit + retry · async",
  icon: <Network className="size-3.5" />,
  details: [
    "Per-source refresh cadences span 50 ms → 24 h",
    "Exponential-backoff retries on any failure",
    "Market-hours-aware scheduling",
    "Writes the freshest tick state to the DB hot tier",
  ],
};

export const FEATURE_ENGINE: PipelineStage = {
  title: "Feature Engine · 148 features",
  tagline: "Volatility cones · regime-adjusted momentum · cross-asset deltas",
  accent: "model",
  icon: <Cpu className="size-3.5" />,
  details: [
    "Sentiment z-scores per ticker",
    "Microstructure features: bid/ask pressure, order-book imbalance",
    "Lagged macro indicators",
    "Correlation-based pruning drops redundant features",
  ],
};

// Three parallel analyzers that sit between the feature engine and the
// aggregator. Rendered as a compact row.
export const ANALYZERS: ReadonlyArray<PipelineStage> = [
  {
    title: "Order Flow",
    tagline: "price · volume · bid/ask pressure",
    details: [
      "Order-book imbalance features",
      "Short-horizon price velocity",
    ],
  },
  {
    title: "Sentiment",
    tagline: "reddit · stocktwits · twitter · news",
    details: [
      "Z-scored per ticker to kill hype baselines",
      "Source-weighted by historical predictive value",
    ],
  },
  {
    title: "Smart Money",
    tagline: "options flow · dark pools · insiders · political",
    details: [
      "Unusual-options-volume detection",
      "Insider-cluster and politician-trade overlays",
    ],
  },
];

export const CORRELATION: PipelineStage = {
  title: "Correlation Analyzer",
  tagline: "SPY / VIX / sectors / international cross-reads",
  icon: <Network className="size-3.5" />,
};

export const AGGREGATOR: PipelineStage = {
  title: "Signal Aggregator",
  tagline:
    "Consensus scoring · conflict detection · confidence · horizon weighting",
  icon: <Waypoints className="size-3.5" />,
  details: [
    "Per-analyzer confidence gets horizon-weighted before fusion",
    "Conflicting signals surface explicitly instead of being averaged away",
  ],
};

// HMM regime feeds the LSTM predictor as a side input. Rendered side-by-
// side in a 1fr / 2fr grid.
export const HMM: PipelineStage = {
  title: "HMM Regime",
  tagline: "hmmlearn over returns + realized vol",
  icon: <Activity className="size-3.5" />,
  details: ["Bull-trending", "Bear-trending", "High-vol chop", "Low-vol grind"],
};

export const LSTM: PipelineStage = {
  title: "MultiHeadLSTM Predictor",
  tagline:
    "Shared encoder · 10 per-horizon heads · horizons span minutes → weeks",
  accent: "model",
  icon: <Brain className="size-3.5" />,
  details: [
    "Closed-loop feature attention keeps predictions tied to live inputs",
    "EMA smoothing α = 0.15 with clipping to [0.5, 2.0]",
    "One shared encoder feeds every horizon head",
  ],
  defaultOpen: true,
};

export const VALIDATOR: PipelineStage = {
  title: "6-Check Prediction Validator",
  tagline:
    "direction · magnitude · confidence · regime fit · horizon coherence · drift",
  accent: "gate",
  icon: <ShieldCheck className="size-3.5" />,
  details: [
    "Every forecast must pass all six checks before publication",
    "Failures are logged with the offending axis so drift is visible",
  ],
};

export const DASHBOARD: PipelineStage = {
  title: "FastAPI + WebSocket Dashboard",
  tagline:
    "Streaming predictions · attention weights · regime label · validator stats",
  icon: <Terminal className="size-3.5" />,
  details: [
    "REST surface for batch backtests",
    "WebSocket push for live, low-latency dashboard updates",
  ],
};

// ---------------------------------------------------------------------------
// Right column: database + retrain / rollback loop
// ---------------------------------------------------------------------------

export const DATABASE: PipelineStage = {
  title: "Database Layer",
  tagline: "3-tier: SQLite (hot) · Parquet (warm) · archive (cold)",
  accent: "db",
  icon: <Database className="size-3.5" />,
  defaultOpen: true,
  details: [
    "Historical data — bars / ticks / macro",
    "Predictions — OOF + live forecasts",
    "Training checkpoints — incumbent + candidates",
    "Watchlist — user-managed symbols",
  ],
};

export const LEARNER: PipelineStage = {
  title: "Continuous Learner",
  tagline: "Weekly retrain on a rolling window",
  accent: "feedback",
  icon: <RefreshCw className="size-3.5" />,
  details: [
    "Writes candidate checkpoint to the DB",
    "Requests promotion from the backtester",
  ],
};

export const BACKTESTER: PipelineStage = {
  title: "Purged K-Fold Backtester",
  tagline: "Embargo windows · regime-stratified folds",
  accent: "feedback",
  icon: <BarChart3 className="size-3.5" />,
  details: [
    "Deploy gate — candidate must beat the incumbent on BOTH:",
    "direction accuracy",
    "worst-regime Sharpe",
  ],
};

// ---------------------------------------------------------------------------
// Legend — semantic color cues for the diagram
// ---------------------------------------------------------------------------

export type LegendItem = {
  label: string;
  swatch: string; // Tailwind bg class used for the 8px swatch square
};

export const LEGEND_ITEMS: ReadonlyArray<LegendItem> = [
  { label: "Model path", swatch: "bg-cyan-500/60" },
  { label: "Retrain / rollback loop", swatch: "bg-amber-500/70" },
  { label: "Deploy-gate validator", swatch: "bg-emerald-500/60" },
  { label: "Database layer", swatch: "bg-slate-500/60" },
];
