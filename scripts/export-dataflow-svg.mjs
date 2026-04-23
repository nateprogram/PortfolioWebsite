// Export the backup V6-dataflow diagram to a standalone SVG (and PNG).
//
// The React component at `src/components/stockai-dataflow.backup.tsx.bak`
// renders a purely-static SVG — no state, no props beyond className, all
// geometry is driven by module-scope constants. This script mirrors those
// constants and emits an equivalent standalone `.svg` file that can live
// in `public/projects/stockai/` and be shared or embedded outside React.
//
// Run from the project root:
//   node scripts/export-dataflow-svg.mjs
//
// Outputs:
//   public/projects/stockai/v6-dataflow.svg
//   public/projects/stockai/v6-dataflow.png  (if sharp is installed)
//
// If the source component is ever regenerated, rerun this script to
// refresh the exported files.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "projects", "stockai");

// ---------- Colors & dimensions (copied from the backup component) ----------
const C = {
  bg: "#0b0f14", // dark backdrop baked in so the SVG reads standalone
  box: "rgba(255,255,255,0.03)",
  boxAccent: "rgba(6,182,212,0.06)",
  boxFeedback: "rgba(245,158,11,0.06)",
  stroke: "rgba(148,163,184,0.35)",
  strokeStrong: "rgba(203,213,225,0.55)",
  edge: "rgba(255,255,255,0.08)",
  text: "#e5e7eb",
  subtext: "#94a3b8",
  muted: "#64748b",
  accent: "#22d3ee",
  feedback: "#f59e0b",
  winCyan: "#38bdf8",
};

const W = 1200;
const H = 1540;

// ---------- Data (mirrors the backup's CATS array) ----------
const CAT_Y = 70;
const CAT_H = 220;
const CAT_W = 172;
const CAT_GAP = 12;
const CATS = [
  {
    label: "PRICE / VOLUME",
    count: 5,
    items: ["Price", "Volume", "Bid / Ask", "Order Book", "Technicals"],
  },
  {
    label: "MARKET CONTEXT",
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
  },
  {
    label: "SOCIAL / NEWS",
    count: 5,
    items: ["Reddit", "StockTwits", "Twitter", "News Feed", "News Sentiment"],
  },
  {
    label: "INSTITUTIONAL",
    count: 4,
    items: ["Options Flow", "Dark Pools", "Insiders", "Political Trades"],
  },
  {
    label: "ECONOMIC / ALT",
    count: 2,
    items: ["Economic Indicators", "Economic Calendar"],
  },
];
const CAT_X = (i) => 16 + i * (CAT_W + CAT_GAP);

const FLOW_X = 30;
const FLOW_W = 880 - 30; // 850 wide
const FLOW = {
  controller: { y: 330, h: 92 },
  featureEngine: { y: 450, h: 92 },
  analyzers: { y: 570, h: 150 },
  correlation: { y: 750, h: 74 },
  aggregator: { y: 852, h: 80 },
  regimeAndModel: { y: 960, h: 160 },
  validator: { y: 1150, h: 82 },
  console: { y: 1260, h: 82 },
};

const DB_X = 908;
const DB_W = 272;
const DB = { y: 330, h: 602 };
const LEARNER = { y: 960, h: 120 };
const BACKTESTER = { y: 1112, h: 120 };

// ---------- Tiny SVG builder helpers ----------
const MONO = "ui-monospace,'JetBrains Mono',Menlo,Consolas,monospace";
const SANS = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif";

// Escape user text so "<" and "&" in labels don't break the XML
function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function box({ x, y, w, h, fill = C.box, stroke = C.stroke, rx = 10 }) {
  return (
    `<g>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>` +
    `<line x1="${x + 6}" x2="${x + w - 6}" y1="${y + 1}" y2="${y + 1}" stroke="${C.edge}" stroke-width="1"/>` +
    `</g>`
  );
}

function arrow({ x1, y1, x2, y2, color = C.strokeStrong, dash }) {
  const marker =
    color === C.feedback ? "url(#arrowFeedback)" : "url(#arrowHead)";
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.25"${dashAttr} marker-end="${marker}"/>`;
}

function text({
  x,
  y,
  children,
  fill = C.text,
  size = 13,
  weight = 600,
  anchor = "start",
  mono = false,
}) {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" font-family="${mono ? MONO : SANS}">` +
    esc(children) +
    `</text>`
  );
}

// ---------- Build the full SVG ----------
const parts = [];

// Scrapers (row 1) — 5 category boxes, each with an arrow down to the controller
CATS.forEach((cat, i) => {
  const x = CAT_X(i);
  parts.push(box({ x, y: CAT_Y, w: CAT_W, h: CAT_H }));
  parts.push(
    text({
      x: x + CAT_W / 2,
      y: CAT_Y + 22,
      children: cat.label,
      anchor: "middle",
      size: 11,
      weight: 700,
      fill: C.accent,
      mono: true,
    })
  );
  parts.push(
    text({
      x: x + CAT_W / 2,
      y: CAT_Y + 40,
      children: `(${cat.count} scrapers)`,
      anchor: "middle",
      size: 11,
      fill: C.subtext,
      mono: true,
    })
  );
  cat.items.forEach((item, j) => {
    parts.push(
      text({
        x: x + 14,
        y: CAT_Y + 62 + j * 18,
        children: `• ${item}`,
        size: 12,
        weight: 500,
        fill: C.text,
      })
    );
  });
  // Down arrow from each category to the controller
  parts.push(
    arrow({
      x1: x + CAT_W / 2,
      y1: CAT_Y + CAT_H,
      x2: x + CAT_W / 2,
      y2: FLOW.controller.y - 2,
      color: C.stroke,
    })
  );
});

// Working Data Controller
parts.push(
  box({ x: FLOW_X, y: FLOW.controller.y, w: FLOW_W, h: FLOW.controller.h })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.controller.y + 24,
    children: "WORKING DATA CONTROLLER",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.controller.y + 44,
    children:
      "collects from all 23 · market-hours aware · rate-limit + retry · async",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.controller.y + 62,
    children: "per-source refresh cadences from 50 ms up to 24 h",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W,
    y1: FLOW.controller.y + FLOW.controller.h / 2,
    x2: DB_X,
    y2: FLOW.controller.y + FLOW.controller.h / 2,
    color: C.stroke,
    dash: "4 3",
  })
);
parts.push(
  text({
    x: FLOW_X + FLOW_W + 4,
    y: FLOW.controller.y + FLOW.controller.h / 2 - 6,
    children: "stores real-time",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W / 2,
    y1: FLOW.controller.y + FLOW.controller.h,
    x2: FLOW_X + FLOW_W / 2,
    y2: FLOW.featureEngine.y - 2,
  })
);

// Feature Engine
parts.push(
  box({
    x: FLOW_X,
    y: FLOW.featureEngine.y,
    w: FLOW_W,
    h: FLOW.featureEngine.h,
    fill: C.boxAccent,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.featureEngine.y + 24,
    children: "FEATURE ENGINE · 148 FEATURES",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.featureEngine.y + 44,
    children:
      "volatility cones · regime-adjusted momentum · cross-asset deltas",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.featureEngine.y + 62,
    children:
      "sentiment z-scores · microstructure · lagged macro · corr-based pruning",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W / 2,
    y1: FLOW.featureEngine.y + FLOW.featureEngine.h,
    x2: FLOW_X + FLOW_W / 2,
    y2: FLOW.analyzers.y - 2,
  })
);

// Three parallel analyzers
{
  const aCount = 3;
  const gap = 16;
  const aW = (FLOW_W - gap * (aCount - 1)) / aCount;
  const ay = FLOW.analyzers.y;
  const ah = FLOW.analyzers.h;
  const boxes = [
    {
      title: "ORDER FLOW",
      lines: ["price · volume", "bid/ask pressure", "order-book imbalance"],
    },
    {
      title: "SENTIMENT",
      lines: ["reddit · stocktwits", "twitter · news", "z-scored per ticker"],
    },
    {
      title: "SMART MONEY",
      lines: ["options flow", "dark pools · insiders", "political trades"],
    },
  ];
  boxes.forEach((b, i) => {
    const x = FLOW_X + i * (aW + gap);
    parts.push(box({ x, y: ay, w: aW, h: ah }));
    parts.push(
      text({
        x: x + aW / 2,
        y: ay + 26,
        children: b.title,
        anchor: "middle",
        size: 13,
        weight: 700,
        fill: C.text,
      })
    );
    parts.push(
      text({
        x: x + aW / 2,
        y: ay + 44,
        children: "analyzer",
        anchor: "middle",
        size: 10,
        fill: C.subtext,
        mono: true,
      })
    );
    b.lines.forEach((line, j) => {
      parts.push(
        text({
          x: x + aW / 2,
          y: ay + 68 + j * 18,
          children: line,
          anchor: "middle",
          size: 11,
          fill: C.subtext,
          mono: true,
        })
      );
    });
    parts.push(
      arrow({
        x1: x + aW / 2,
        y1: ay + ah,
        x2: FLOW_X + FLOW_W / 2,
        y2: FLOW.correlation.y - 2,
        color: C.stroke,
      })
    );
  });
}

// Analyzers raw-read from DB
parts.push(
  arrow({
    x1: DB_X,
    y1: FLOW.analyzers.y + FLOW.analyzers.h / 2,
    x2: FLOW_X + FLOW_W,
    y2: FLOW.analyzers.y + FLOW.analyzers.h / 2,
    color: C.stroke,
    dash: "4 3",
  })
);
parts.push(
  text({
    x: FLOW_X + FLOW_W + 4,
    y: FLOW.analyzers.y + FLOW.analyzers.h / 2 - 6,
    children: "reads historical",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);

// Correlation Analyzer
parts.push(
  box({
    x: FLOW_X + 120,
    y: FLOW.correlation.y,
    w: FLOW_W - 240,
    h: FLOW.correlation.h,
  })
);
parts.push(
  text({
    x: FLOW_X + FLOW_W / 2,
    y: FLOW.correlation.y + 24,
    children: "CORRELATION ANALYZER",
    anchor: "middle",
    size: 12,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: FLOW_X + FLOW_W / 2,
    y: FLOW.correlation.y + 44,
    children: "SPY / VIX / sectors / international cross-reads",
    anchor: "middle",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W / 2,
    y1: FLOW.correlation.y + FLOW.correlation.h,
    x2: FLOW_X + FLOW_W / 2,
    y2: FLOW.aggregator.y - 2,
  })
);

// Signal Aggregator
parts.push(
  box({ x: FLOW_X, y: FLOW.aggregator.y, w: FLOW_W, h: FLOW.aggregator.h })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.aggregator.y + 24,
    children: "SIGNAL AGGREGATOR",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.aggregator.y + 44,
    children:
      "consensus scoring · conflict detection · confidence · horizon weighting",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W,
    y1: FLOW.aggregator.y + FLOW.aggregator.h / 2,
    x2: DB_X,
    y2: FLOW.aggregator.y + FLOW.aggregator.h / 2,
    color: C.stroke,
    dash: "4 3",
  })
);
parts.push(
  text({
    x: FLOW_X + FLOW_W + 4,
    y: FLOW.aggregator.y + FLOW.aggregator.h / 2 - 6,
    children: "stores signals",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W / 2,
    y1: FLOW.aggregator.y + FLOW.aggregator.h,
    x2: FLOW_X + FLOW_W / 2,
    y2: FLOW.regimeAndModel.y - 2,
  })
);

// HMM Regime + MultiHeadLSTM
{
  const gap = 20;
  const hmmW = 260;
  const lstmW = FLOW_W - hmmW - gap;
  const y = FLOW.regimeAndModel.y;
  const h = FLOW.regimeAndModel.h;

  parts.push(box({ x: FLOW_X, y, w: hmmW, h }));
  parts.push(
    text({
      x: FLOW_X + hmmW / 2,
      y: y + 26,
      children: "HMM REGIME",
      anchor: "middle",
      size: 13,
      weight: 700,
      fill: C.text,
    })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW / 2,
      y: y + 46,
      children: "hmmlearn over returns + RV",
      anchor: "middle",
      size: 10,
      fill: C.subtext,
      mono: true,
    })
  );
  ["bull-trending", "bear-trending", "high-vol chop", "low-vol grind"].forEach(
    (lbl, i) => {
      parts.push(
        text({
          x: FLOW_X + hmmW / 2,
          y: y + 70 + i * 18,
          children: lbl,
          anchor: "middle",
          size: 11,
          fill: C.subtext,
          mono: true,
        })
      );
    }
  );
  parts.push(
    arrow({
      x1: FLOW_X + hmmW,
      y1: y + h / 2,
      x2: FLOW_X + hmmW + gap - 2,
      y2: y + h / 2,
    })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW + gap / 2,
      y: y + h / 2 - 6,
      children: "regime",
      anchor: "middle",
      size: 10,
      fill: C.subtext,
      mono: true,
    })
  );

  parts.push(
    box({ x: FLOW_X + hmmW + gap, y, w: lstmW, h, fill: C.boxAccent })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW + gap + lstmW / 2,
      y: y + 26,
      children: "MULTIHEADLSTM PREDICTOR",
      anchor: "middle",
      size: 14,
      weight: 700,
      fill: C.text,
    })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW + gap + lstmW / 2,
      y: y + 46,
      children: "shared encoder · 10 per-horizon heads",
      anchor: "middle",
      size: 11,
      fill: C.accent,
      mono: true,
    })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW + gap + lstmW / 2,
      y: y + 70,
      children: "closed-loop feature attention",
      anchor: "middle",
      size: 11,
      fill: C.subtext,
      mono: true,
    })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW + gap + lstmW / 2,
      y: y + 88,
      children: "EMA α=0.15 · clip [0.5, 2.0]",
      anchor: "middle",
      size: 11,
      fill: C.subtext,
      mono: true,
    })
  );
  parts.push(
    text({
      x: FLOW_X + hmmW + gap + lstmW / 2,
      y: y + 112,
      children: "horizons: minutes → weeks",
      anchor: "middle",
      size: 11,
      fill: C.subtext,
      mono: true,
    })
  );

  parts.push(
    arrow({
      x1: FLOW_X + FLOW_W / 2,
      y1: y + h,
      x2: FLOW_X + FLOW_W / 2,
      y2: FLOW.validator.y - 2,
    })
  );
}

// Validator (6 checks)
parts.push(
  box({ x: FLOW_X, y: FLOW.validator.y, w: FLOW_W, h: FLOW.validator.h })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.validator.y + 24,
    children: "6-CHECK PREDICTION VALIDATOR",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.validator.y + 44,
    children:
      "direction · magnitude · confidence · regime fit · horizon coherence · drift",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.validator.y + 62,
    children: "gates publication of every forecast",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  arrow({
    x1: FLOW_X + FLOW_W / 2,
    y1: FLOW.validator.y + FLOW.validator.h,
    x2: FLOW_X + FLOW_W / 2,
    y2: FLOW.console.y - 2,
  })
);

// Console / Dashboard
parts.push(box({ x: FLOW_X, y: FLOW.console.y, w: FLOW_W, h: FLOW.console.h }));
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.console.y + 24,
    children: "FASTAPI + WEBSOCKET DASHBOARD",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.console.y + 44,
    children:
      "streaming predictions · attention weights · regime label · validator stats",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: FLOW_X + 18,
    y: FLOW.console.y + 62,
    children: "REST surface for batch backtests",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);

// Right column: Database
parts.push(
  box({
    x: DB_X,
    y: DB.y,
    w: DB_W,
    h: DB.h,
    fill: C.box,
    stroke: C.strokeStrong,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: DB.y + 28,
    children: "DATABASE LAYER",
    anchor: "middle",
    size: 14,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: DB.y + 48,
    children: "3-tier: SQLite hot · Parquet warm · archive cold",
    anchor: "middle",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
const SUBSTORES = [
  ["Historical data", "bars / ticks / macro"],
  ["Predictions", "OOF + live forecasts"],
  ["Training checkpoints", "incumbent + candidates"],
  ["Watchlist", "user-managed symbols"],
];
SUBSTORES.forEach(([label, sub], i) => {
  parts.push(
    `<rect x="${DB_X + 16}" y="${DB.y + 78 + i * 62}" width="${DB_W - 32}" height="52" rx="8" fill="${C.boxAccent}" stroke="${C.stroke}"/>`
  );
  parts.push(
    text({
      x: DB_X + DB_W / 2,
      y: DB.y + 78 + i * 62 + 22,
      children: label,
      anchor: "middle",
      size: 12,
      weight: 600,
      fill: C.text,
    })
  );
  parts.push(
    text({
      x: DB_X + DB_W / 2,
      y: DB.y + 78 + i * 62 + 40,
      children: sub,
      anchor: "middle",
      size: 10,
      fill: C.subtext,
      mono: true,
    })
  );
});
// DB -> Predictor curved read
parts.push(
  `<path d="M ${DB_X} ${DB.y + DB.h - 80} C ${DB_X - 40} ${DB.y + DB.h - 80}, ${FLOW_X + FLOW_W / 2 + 180} ${FLOW.regimeAndModel.y + 40}, ${FLOW_X + FLOW_W / 2 + 160} ${FLOW.regimeAndModel.y + 40}" fill="none" stroke="${C.stroke}" stroke-dasharray="4 3" stroke-width="1"/>`
);

// Continuous Learner
parts.push(
  box({
    x: DB_X,
    y: LEARNER.y,
    w: DB_W,
    h: LEARNER.h,
    fill: C.boxFeedback,
    stroke: C.feedback,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: LEARNER.y + 26,
    children: "CONTINUOUS LEARNER",
    anchor: "middle",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: LEARNER.y + 46,
    children: "weekly retrain · rolling window",
    anchor: "middle",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: LEARNER.y + 72,
    children: "writes candidate ckpt → DB",
    anchor: "middle",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: LEARNER.y + 92,
    children: "requests promotion from backtester",
    anchor: "middle",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);

// Purged K-Fold Backtester
parts.push(
  box({
    x: DB_X,
    y: BACKTESTER.y + 18,
    w: DB_W,
    h: BACKTESTER.h,
    fill: C.boxFeedback,
    stroke: C.feedback,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: BACKTESTER.y + 44,
    children: "PURGED K-FOLD BACKTESTER",
    anchor: "middle",
    size: 13,
    weight: 700,
    fill: C.text,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: BACKTESTER.y + 64,
    children: "embargo windows · regime-stratified",
    anchor: "middle",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: BACKTESTER.y + 88,
    children: "▼ deploy gate ▼",
    anchor: "middle",
    size: 11,
    fill: C.feedback,
    weight: 600,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: BACKTESTER.y + 108,
    children: "must beat incumbent on BOTH",
    anchor: "middle",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W / 2,
    y: BACKTESTER.y + 124,
    children: "direction AND worst-regime",
    anchor: "middle",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);

// THE FEEDBACK LOOP — amber curved arrow from Learner up to Predictor
parts.push(
  `<path d="M ${DB_X + DB_W / 2} ${LEARNER.y} C ${DB_X + DB_W / 2} ${LEARNER.y - 80}, ${DB_X + DB_W + 60} ${FLOW.regimeAndModel.y + 40}, ${FLOW_X + FLOW_W - 8} ${FLOW.regimeAndModel.y + 30}" fill="none" stroke="${C.feedback}" stroke-width="2.25" marker-end="url(#arrowFeedback)"/>`
);
parts.push(
  text({
    x: DB_X + DB_W + 8,
    y: LEARNER.y - 90,
    children: "retrain",
    size: 12,
    weight: 700,
    fill: C.feedback,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W + 8,
    y: LEARNER.y - 74,
    children: "& rollback",
    size: 12,
    weight: 700,
    fill: C.feedback,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W + 8,
    y: LEARNER.y - 58,
    children: "promoted",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);
parts.push(
  text({
    x: DB_X + DB_W + 8,
    y: LEARNER.y - 44,
    children: "checkpoints",
    size: 10,
    fill: C.subtext,
    mono: true,
  })
);

// Legend (bottom-left)
parts.push(
  `<g transform="translate(30, ${H - 60})">` +
    `<rect x="0" y="0" width="360" height="42" rx="6" fill="${C.box}" stroke="${C.stroke}"/>` +
    `<line x1="14" x2="38" y1="15" y2="15" stroke="${C.strokeStrong}" stroke-width="1.25" marker-end="url(#arrowHead)"/>` +
    text({
      x: 44,
      y: 18,
      children: "forward data flow",
      size: 10,
      fill: C.subtext,
      mono: true,
    }) +
    `<line x1="14" x2="38" y1="32" y2="32" stroke="${C.feedback}" stroke-width="2" marker-end="url(#arrowFeedback)"/>` +
    text({
      x: 44,
      y: 35,
      children: "retrain / deploy-gate feedback loop",
      size: 10,
      fill: C.feedback,
      mono: true,
    }) +
    `<line x1="210" x2="234" y1="15" y2="15" stroke="${C.stroke}" stroke-width="1" stroke-dasharray="4 3"/>` +
    text({
      x: 240,
      y: 18,
      children: "database read / write",
      size: 10,
      fill: C.subtext,
      mono: true,
    }) +
    `</g>`
);

// Title (rendered last so a subtle bg behind it could be added if needed)
parts.unshift(
  text({
    x: W / 2,
    y: 34,
    children: "V6 DATA FLOW · 23 SCRAPERS · 148 FEATURES · 10-HEAD LSTM",
    anchor: "middle",
    size: 18,
    weight: 700,
    fill: C.text,
  }),
  text({
    x: W / 2,
    y: 52,
    children:
      "peers are side-by-side · database off to the right · feedback loop in amber",
    anchor: "middle",
    size: 11,
    fill: C.subtext,
    mono: true,
  })
);

const SVG =
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="V6 data flow — 23 scrapers, 148 features, 10-head LSTM predictor with retrain and deploy-gate feedback loop.">
  <defs>
    <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.strokeStrong}"/>
    </marker>
    <marker id="arrowFeedback" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.feedback}"/>
    </marker>
  </defs>
  <!-- Dark backdrop baked in so the SVG reads standalone outside the site's dark-mode page. -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="${C.bg}"/>
  ${parts.join("\n  ")}
</svg>
`;

const svgPath = join(OUT_DIR, "v6-dataflow.svg");
writeFileSync(svgPath, SVG, "utf8");
console.log(`[export-dataflow] wrote ${svgPath} (${SVG.length} bytes)`);

// Optional: render to PNG via sharp if available. Sharp ships with Next.js
// image optimization, so it should resolve without a separate install.
try {
  const sharpMod = await import("sharp");
  const sharp = sharpMod.default ?? sharpMod;
  const pngPath = join(OUT_DIR, "v6-dataflow.png");
  // 2x density gives a ~2400x3080 crisp raster for high-DPI screens.
  await sharp(Buffer.from(SVG), { density: 288 })
    .png()
    .toFile(pngPath);
  console.log(`[export-dataflow] wrote ${pngPath}`);
} catch (err) {
  console.warn(
    `[export-dataflow] skipped PNG render (sharp unavailable):`,
    err?.message ?? err
  );
}
