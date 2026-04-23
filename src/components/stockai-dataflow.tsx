"use client";

import { cn } from "@/lib/utils";

// V6 data flow as a positional SVG, modeled after the original V5
// architecture doc: scrapers sit side-by-side (peers that do not share
// data with each other), the database is off to the right so its
// multi-layer interactions are visible, and the retrain / deploy gate
// feedback loop is drawn as an explicit curved arrow back to the model.

const C = {
  bg: "transparent",
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
} as const;

const W = 1200;
const H = 1640;

// The layout we liked was authored at base type sizes; scaling them up by
// ~45 % here gives readable labels at the widths the SVG actually renders
// (the page scales the 1200-wide viewBox down to ~800 px, which ate too
// much type). Layout geometry is untouched — only the per-label fontSize
// is multiplied.
const TEXT_SCALE = 1.45;

// ---------- Scraper categories (5 columns of peers) ----------
const CAT_Y = 70;
const CAT_H = 220;
const CAT_W = 172;
const CAT_GAP = 12;
const CATS: ReadonlyArray<{
  label: string;
  count: number;
  items: ReadonlyArray<string>;
}> = [
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
const CAT_X = (i: number) => 16 + i * (CAT_W + CAT_GAP);

// ---------- Main flow rows (center column) ----------
const FLOW_X = 30;
const FLOW_W = 880 - 30; // 850 wide
const FLOW = {
  controller: { y: 330, h: 108 },
  featureEngine: { y: 460, h: 108 },
  analyzers: { y: 590, h: 170 },
  correlation: { y: 780, h: 86 },
  aggregator: { y: 890, h: 96 },
  regimeAndModel: { y: 1010, h: 190 },
  validator: { y: 1220, h: 96 },
  console: { y: 1340, h: 96 },
} as const;

// ---------- Right column (database + feedback infra) ----------
const DB_X = 908;
const DB_W = 272;
const DB = { y: 330, h: 656 }; // spans controller -> aggregator
const LEARNER = { y: 1010, h: 140 };
const BACKTESTER = { y: 1170, h: 150 };

// ---------- Helpers ----------
function Box({
  x,
  y,
  w,
  h,
  fill = C.box,
  stroke = C.stroke,
  rx = 10,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  rx?: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
      {/* silver top edge */}
      <line
        x1={x + 6}
        x2={x + w - 6}
        y1={y + 1}
        y2={y + 1}
        stroke={C.edge}
        strokeWidth={1}
      />
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = C.strokeStrong,
  dash,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dash?: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={1.25}
      strokeDasharray={dash}
      markerEnd={
        color === C.feedback ? "url(#arrowFeedback)" : "url(#arrowHead)"
      }
    />
  );
}

function TextLine({
  x,
  y,
  children,
  fill = C.text,
  size = 13,
  weight = 600,
  anchor = "start",
  mono = false,
  raw = false,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  fill?: string;
  size?: number;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  mono?: boolean;
  // Skip the TEXT_SCALE multiplier. Use this for peripheral labels that
  // need to stay physically small (arrow annotations, gutter feedback
  // callouts) so they don't overrun their container.
  raw?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={raw ? size : size * TEXT_SCALE}
      fontWeight={weight}
      textAnchor={anchor}
      fontFamily={
        mono
          ? "ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
          : "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
      }
    >
      {children}
    </text>
  );
}

export function StockaiDataflow({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="V6 data flow. 23 scrapers in 5 peer categories (price/volume, market context, social/news, institutional, economic/alternative) feed a working data controller. A feature engine derives 148 features consumed by three analyzers (order flow, sentiment, smart money) and a correlation analyzer. A signal aggregator feeds an HMM regime detector and a MultiHeadLSTM with 10 heads. A 6-check prediction validator gates the console dashboard. A database layer on the right interacts with multiple stages. A continuous learner and a Purged K-Fold backtester form the retrain and deploy gate, with an explicit feedback arrow back to the predictor."
      className={cn("block w-full h-auto", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="arrowHead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.strokeStrong} />
        </marker>
        <marker
          id="arrowFeedback"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.feedback} />
        </marker>
      </defs>

      {/* Title */}
      <TextLine
        x={W / 2}
        y={34}
        anchor="middle"
        size={18}
        weight={700}
        fill={C.text}
      >
        V6 DATA FLOW · 23 SCRAPERS · 148 FEATURES · 10-HEAD LSTM
      </TextLine>
      <TextLine
        x={W / 2}
        y={52}
        anchor="middle"
        size={11}
        fill={C.subtext}
        mono
      >
        peers are side-by-side · database off to the right · feedback loop in
        amber
      </TextLine>

      {/* =============================================================== */}
      {/* Row 1: 5 scraper category boxes (peers, no cross-talk) */}
      {/* =============================================================== */}
      {CATS.map((cat, i) => {
        const x = CAT_X(i);
        return (
          <g key={cat.label}>
            <Box x={x} y={CAT_Y} w={CAT_W} h={CAT_H} />
            <TextLine
              x={x + CAT_W / 2}
              y={CAT_Y + 22}
              anchor="middle"
              size={11}
              weight={700}
              fill={C.accent}
              mono
            >
              {cat.label}
            </TextLine>
            <TextLine
              x={x + CAT_W / 2}
              y={CAT_Y + 40}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              ({cat.count} scrapers)
            </TextLine>
            {cat.items.map((item, j) => (
              <TextLine
                key={item}
                x={x + 14}
                y={CAT_Y + 62 + j * 22}
                size={12}
                weight={500}
                fill={C.text}
              >
                • {item}
              </TextLine>
            ))}
            {/* Down-arrow from each category to the data controller */}
            <Arrow
              x1={x + CAT_W / 2}
              y1={CAT_Y + CAT_H}
              x2={x + CAT_W / 2}
              y2={FLOW.controller.y - 2}
              color={C.stroke}
            />
          </g>
        );
      })}

      {/* =============================================================== */}
      {/* Row 2: Working Data Controller */}
      {/* =============================================================== */}
      <g>
        <Box
          x={FLOW_X}
          y={FLOW.controller.y}
          w={FLOW_W}
          h={FLOW.controller.h}
        />
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.controller.y + 30}
          size={13}
          weight={700}
          fill={C.text}
        >
          WORKING DATA CONTROLLER
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.controller.y + 58}
          size={11}
          fill={C.subtext}
          mono
        >
          collects from all 23 · market-hours aware · rate-limit + retry · async
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.controller.y + 82}
          size={11}
          fill={C.subtext}
          mono
        >
          per-source refresh cadences from 50 ms up to 24 h
        </TextLine>
        {/* Hot-store side-arrow to Database. Its semantics are covered by
            the "database read / write" legend row, so no inline label —
            scaled type made the previous caption overrun the DB box. */}
        <Arrow
          x1={FLOW_X + FLOW_W}
          y1={FLOW.controller.y + FLOW.controller.h / 2}
          x2={DB_X}
          y2={FLOW.controller.y + FLOW.controller.h / 2}
          color={C.stroke}
          dash="4 3"
        />
        {/* Down to feature engine */}
        <Arrow
          x1={FLOW_X + FLOW_W / 2}
          y1={FLOW.controller.y + FLOW.controller.h}
          x2={FLOW_X + FLOW_W / 2}
          y2={FLOW.featureEngine.y - 2}
        />
      </g>

      {/* =============================================================== */}
      {/* Row 3: Feature Engine */}
      {/* =============================================================== */}
      <g>
        <Box
          x={FLOW_X}
          y={FLOW.featureEngine.y}
          w={FLOW_W}
          h={FLOW.featureEngine.h}
          fill={C.boxAccent}
        />
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.featureEngine.y + 30}
          size={13}
          weight={700}
          fill={C.text}
        >
          FEATURE ENGINE · 148 FEATURES
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.featureEngine.y + 58}
          size={11}
          fill={C.subtext}
          mono
        >
          volatility cones · regime-adjusted momentum · cross-asset deltas
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.featureEngine.y + 82}
          size={11}
          fill={C.subtext}
          mono
        >
          sentiment z-scores · microstructure · lagged macro · corr-based
          pruning
        </TextLine>
        <Arrow
          x1={FLOW_X + FLOW_W / 2}
          y1={FLOW.featureEngine.y + FLOW.featureEngine.h}
          x2={FLOW_X + FLOW_W / 2}
          y2={FLOW.analyzers.y - 2}
        />
      </g>

      {/* =============================================================== */}
      {/* Row 4: three parallel analyzers (peers) */}
      {/* =============================================================== */}
      {(() => {
        const aCount = 3;
        const gap = 16;
        const aW = (FLOW_W - gap * (aCount - 1)) / aCount;
        const ay = FLOW.analyzers.y;
        const ah = FLOW.analyzers.h;
        const boxes: ReadonlyArray<{
          title: string;
          lines: ReadonlyArray<string>;
        }> = [
          {
            title: "ORDER FLOW",
            lines: [
              "price · volume",
              "bid/ask pressure",
              "order-book imbalance",
            ],
          },
          {
            title: "SENTIMENT",
            lines: [
              "reddit · stocktwits",
              "twitter · news",
              "z-scored per ticker",
            ],
          },
          {
            title: "SMART MONEY",
            lines: [
              "options flow",
              "dark pools · insiders",
              "political trades",
            ],
          },
        ];
        return boxes.map((b, i) => {
          const x = FLOW_X + i * (aW + gap);
          return (
            <g key={b.title}>
              <Box x={x} y={ay} w={aW} h={ah} />
              <TextLine
                x={x + aW / 2}
                y={ay + 30}
                anchor="middle"
                size={13}
                weight={700}
                fill={C.text}
              >
                {b.title}
              </TextLine>
              <TextLine
                x={x + aW / 2}
                y={ay + 52}
                anchor="middle"
                size={10}
                fill={C.subtext}
                mono
              >
                analyzer
              </TextLine>
              {b.lines.map((line, j) => (
                <TextLine
                  key={line}
                  x={x + aW / 2}
                  y={ay + 82 + j * 24}
                  anchor="middle"
                  size={11}
                  fill={C.subtext}
                  mono
                >
                  {line}
                </TextLine>
              ))}
              {/* arrow down into correlation */}
              <Arrow
                x1={x + aW / 2}
                y1={ay + ah}
                x2={FLOW_X + FLOW_W / 2}
                y2={FLOW.correlation.y - 2}
                color={C.stroke}
              />
            </g>
          );
        });
      })()}

      {/* Analyzers raw-read from DB — dashed arrow already conveys the
          read relationship via the legend; inline label dropped. */}
      <Arrow
        x1={DB_X}
        y1={FLOW.analyzers.y + FLOW.analyzers.h / 2}
        x2={FLOW_X + FLOW_W}
        y2={FLOW.analyzers.y + FLOW.analyzers.h / 2}
        color={C.stroke}
        dash="4 3"
      />

      {/* =============================================================== */}
      {/* Row 5: Correlation analyzer */}
      {/* =============================================================== */}
      <g>
        <Box
          x={FLOW_X + 120}
          y={FLOW.correlation.y}
          w={FLOW_W - 240}
          h={FLOW.correlation.h}
        />
        <TextLine
          x={FLOW_X + FLOW_W / 2}
          y={FLOW.correlation.y + 30}
          anchor="middle"
          size={12}
          weight={700}
          fill={C.text}
        >
          CORRELATION ANALYZER
        </TextLine>
        <TextLine
          x={FLOW_X + FLOW_W / 2}
          y={FLOW.correlation.y + 58}
          anchor="middle"
          size={10}
          fill={C.subtext}
          mono
        >
          SPY / VIX / sectors / international cross-reads
        </TextLine>
        <Arrow
          x1={FLOW_X + FLOW_W / 2}
          y1={FLOW.correlation.y + FLOW.correlation.h}
          x2={FLOW_X + FLOW_W / 2}
          y2={FLOW.aggregator.y - 2}
        />
      </g>

      {/* =============================================================== */}
      {/* Row 6: Signal Aggregator */}
      {/* =============================================================== */}
      <g>
        <Box
          x={FLOW_X}
          y={FLOW.aggregator.y}
          w={FLOW_W}
          h={FLOW.aggregator.h}
        />
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.aggregator.y + 32}
          size={13}
          weight={700}
          fill={C.text}
        >
          SIGNAL AGGREGATOR
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.aggregator.y + 64}
          size={11}
          fill={C.subtext}
          mono
        >
          consensus scoring · conflict detection · confidence · horizon
          weighting
        </TextLine>
        <Arrow
          x1={FLOW_X + FLOW_W}
          y1={FLOW.aggregator.y + FLOW.aggregator.h / 2}
          x2={DB_X}
          y2={FLOW.aggregator.y + FLOW.aggregator.h / 2}
          color={C.stroke}
          dash="4 3"
        />
        <Arrow
          x1={FLOW_X + FLOW_W / 2}
          y1={FLOW.aggregator.y + FLOW.aggregator.h}
          x2={FLOW_X + FLOW_W / 2}
          y2={FLOW.regimeAndModel.y - 2}
        />
      </g>

      {/* =============================================================== */}
      {/* Row 7: HMM Regime (feeds LSTM) + MultiHeadLSTM */}
      {/* =============================================================== */}
      {(() => {
        const gap = 20;
        const hmmW = 260;
        const lstmW = FLOW_W - hmmW - gap;
        const y = FLOW.regimeAndModel.y;
        const h = FLOW.regimeAndModel.h;
        return (
          <g>
            <Box x={FLOW_X} y={y} w={hmmW} h={h} />
            <TextLine
              x={FLOW_X + hmmW / 2}
              y={y + 30}
              anchor="middle"
              size={13}
              weight={700}
              fill={C.text}
            >
              HMM REGIME
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW / 2}
              y={y + 52}
              anchor="middle"
              size={10}
              fill={C.subtext}
              mono
            >
              hmmlearn over returns + RV
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW / 2}
              y={y + 82}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              bull-trending
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW / 2}
              y={y + 106}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              bear-trending
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW / 2}
              y={y + 130}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              high-vol chop
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW / 2}
              y={y + 154}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              low-vol grind
            </TextLine>

            {/* HMM -> LSTM lateral arrow */}
            <Arrow
              x1={FLOW_X + hmmW}
              y1={y + h / 2}
              x2={FLOW_X + hmmW + gap - 2}
              y2={y + h / 2}
            />
            <TextLine
              x={FLOW_X + hmmW + gap / 2}
              y={y + h / 2 - 6}
              anchor="middle"
              size={10}
              fill={C.subtext}
              mono
            >
              regime
            </TextLine>

            <Box
              x={FLOW_X + hmmW + gap}
              y={y}
              w={lstmW}
              h={h}
              fill={C.boxAccent}
            />
            <TextLine
              x={FLOW_X + hmmW + gap + lstmW / 2}
              y={y + 32}
              anchor="middle"
              size={14}
              weight={700}
              fill={C.text}
            >
              MULTIHEADLSTM PREDICTOR
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW + gap + lstmW / 2}
              y={y + 58}
              anchor="middle"
              size={11}
              fill={C.accent}
              mono
            >
              shared encoder · 10 per-horizon heads
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW + gap + lstmW / 2}
              y={y + 88}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              closed-loop feature attention
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW + gap + lstmW / 2}
              y={y + 114}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              EMA α=0.15 · clip [0.5, 2.0]
            </TextLine>
            <TextLine
              x={FLOW_X + hmmW + gap + lstmW / 2}
              y={y + 146}
              anchor="middle"
              size={11}
              fill={C.subtext}
              mono
            >
              horizons: minutes → weeks
            </TextLine>

            {/* Model -> Validator */}
            <Arrow
              x1={FLOW_X + FLOW_W / 2}
              y1={y + h}
              x2={FLOW_X + FLOW_W / 2}
              y2={FLOW.validator.y - 2}
            />
          </g>
        );
      })()}

      {/* =============================================================== */}
      {/* Row 8: Prediction Validator (6 checks) */}
      {/* =============================================================== */}
      <g>
        <Box
          x={FLOW_X}
          y={FLOW.validator.y}
          w={FLOW_W}
          h={FLOW.validator.h}
        />
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.validator.y + 28}
          size={13}
          weight={700}
          fill={C.text}
        >
          6-CHECK PREDICTION VALIDATOR
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.validator.y + 54}
          size={11}
          fill={C.subtext}
          mono
        >
          direction · magnitude · confidence · regime fit · horizon coherence ·
          drift
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.validator.y + 78}
          size={11}
          fill={C.subtext}
          mono
        >
          gates publication of every forecast
        </TextLine>
        <Arrow
          x1={FLOW_X + FLOW_W / 2}
          y1={FLOW.validator.y + FLOW.validator.h}
          x2={FLOW_X + FLOW_W / 2}
          y2={FLOW.console.y - 2}
        />
      </g>

      {/* =============================================================== */}
      {/* Row 9: Console / Dashboard */}
      {/* =============================================================== */}
      <g>
        <Box
          x={FLOW_X}
          y={FLOW.console.y}
          w={FLOW_W}
          h={FLOW.console.h}
        />
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.console.y + 28}
          size={13}
          weight={700}
          fill={C.text}
        >
          FASTAPI + WEBSOCKET DASHBOARD
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.console.y + 54}
          size={11}
          fill={C.subtext}
          mono
        >
          streaming predictions · attention weights · regime label · validator
          stats
        </TextLine>
        <TextLine
          x={FLOW_X + 18}
          y={FLOW.console.y + 78}
          size={11}
          fill={C.subtext}
          mono
        >
          REST surface for batch backtests
        </TextLine>
      </g>

      {/* =============================================================== */}
      {/* Right column: Database (spans 4 rows, off to the side) */}
      {/* =============================================================== */}
      <g>
        <Box
          x={DB_X}
          y={DB.y}
          w={DB_W}
          h={DB.h}
          fill={C.box}
          stroke={C.strokeStrong}
        />
        <TextLine
          x={DB_X + DB_W / 2}
          y={DB.y + 32}
          anchor="middle"
          size={14}
          weight={700}
          fill={C.text}
        >
          DATABASE LAYER
        </TextLine>
        {/* 3-tier storage description. Split across two `raw` lines
            because at scaled 10pt the single sentence ran past the
            DB box's right edge. */}
        <TextLine
          x={DB_X + DB_W / 2}
          y={DB.y + 54}
          anchor="middle"
          size={11}
          fill={C.subtext}
          mono
          raw
        >
          3-tier: SQLite · Parquet · archive
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={DB.y + 70}
          anchor="middle"
          size={11}
          fill={C.subtext}
          mono
          raw
        >
          hot · warm · cold
        </TextLine>
        {/* Four sub-stores */}
        {[
          "Historical data",
          "Predictions",
          "Training checkpoints",
          "Watchlist",
        ].map((t, i) => (
          <g key={t}>
            <rect
              x={DB_X + 16}
              y={DB.y + 88 + i * 72}
              width={DB_W - 32}
              height={60}
              rx={8}
              fill={C.boxAccent}
              stroke={C.stroke}
            />
            <TextLine
              x={DB_X + DB_W / 2}
              y={DB.y + 88 + i * 72 + 26}
              anchor="middle"
              size={12}
              weight={600}
              fill={C.text}
            >
              {t}
            </TextLine>
            <TextLine
              x={DB_X + DB_W / 2}
              y={DB.y + 88 + i * 72 + 48}
              anchor="middle"
              size={10}
              fill={C.subtext}
              mono
            >
              {i === 0
                ? "bars / ticks / macro"
                : i === 1
                ? "OOF + live forecasts"
                : i === 2
                ? "incumbent + candidates"
                : "user-managed symbols"}
            </TextLine>
          </g>
        ))}
        {/* DB -> Predictor arrow (historical reads) */}
        <path
          d={`M ${DB_X} ${DB.y + DB.h - 80}
              C ${DB_X - 40} ${DB.y + DB.h - 80},
                ${FLOW_X + FLOW_W / 2 + 180} ${FLOW.regimeAndModel.y + 40},
                ${FLOW_X + FLOW_W / 2 + 160} ${FLOW.regimeAndModel.y + 40}`}
          fill="none"
          stroke={C.stroke}
          strokeDasharray="4 3"
          strokeWidth={1}
        />
      </g>

      {/* =============================================================== */}
      {/* Right column bottom: Continuous Learner */}
      {/* =============================================================== */}
      <g>
        <Box
          x={DB_X}
          y={LEARNER.y}
          w={DB_W}
          h={LEARNER.h}
          fill={C.boxFeedback}
          stroke={C.feedback}
        />
        <TextLine
          x={DB_X + DB_W / 2}
          y={LEARNER.y + 30}
          anchor="middle"
          size={13}
          weight={700}
          fill={C.text}
        >
          CONTINUOUS LEARNER
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={LEARNER.y + 54}
          anchor="middle"
          size={10}
          fill={C.subtext}
          mono
        >
          weekly retrain · rolling window
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={LEARNER.y + 84}
          anchor="middle"
          size={11}
          fill={C.subtext}
          mono
        >
          writes candidate ckpt → DB
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={LEARNER.y + 112}
          anchor="middle"
          size={11}
          fill={C.subtext}
          mono
        >
          requests promotion from backtester
        </TextLine>
      </g>

      {/* Right column bottom: Purged K-Fold Backtester (deploy gate) */}
      <g>
        <Box
          x={DB_X}
          y={BACKTESTER.y + 18}
          w={DB_W}
          h={BACKTESTER.h}
          fill={C.boxFeedback}
          stroke={C.feedback}
        />
        <TextLine
          x={DB_X + DB_W / 2}
          y={BACKTESTER.y + 48}
          anchor="middle"
          size={13}
          weight={700}
          fill={C.text}
        >
          PURGED K-FOLD BACKTESTER
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={BACKTESTER.y + 72}
          anchor="middle"
          size={10}
          fill={C.subtext}
          mono
        >
          embargo windows · regime-stratified
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={BACKTESTER.y + 102}
          anchor="middle"
          size={11}
          fill={C.feedback}
          weight={600}
          mono
        >
          ▼ deploy gate ▼
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={BACKTESTER.y + 128}
          anchor="middle"
          size={11}
          fill={C.subtext}
          mono
        >
          must beat incumbent on BOTH
        </TextLine>
        <TextLine
          x={DB_X + DB_W / 2}
          y={BACKTESTER.y + 150}
          anchor="middle"
          size={11}
          fill={C.subtext}
          mono
        >
          direction AND worst-regime
        </TextLine>
      </g>

      {/* =============================================================== */}
      {/* THE FEEDBACK LOOP — explicit amber curved arrow:
           Backtester → Learner → PROMOTED MODEL back up to LSTM Predictor */}
      {/* =============================================================== */}
      <g>
        {/* One bold curved arrow from the Learner top center, arcing
            up-and-left through the empty bottom region of the DB box,
            then dropping into the top of the LSTM predictor. All four
            control points stay inside the 0–1200 viewBox (the earlier
            control at x = 1240 was what pushed the arrow off-canvas and
            back through the Continuous Learner's own text). */}
        <path
          d={`M ${DB_X + DB_W / 2} ${LEARNER.y}
              C ${DB_X + DB_W / 2} ${LEARNER.y - 80},
                ${FLOW_X + FLOW_W - 60} ${LEARNER.y - 80},
                ${FLOW_X + FLOW_W - 60} ${FLOW.regimeAndModel.y - 4}`}
          fill="none"
          stroke={C.feedback}
          strokeWidth={2.25}
          markerEnd="url(#arrowFeedback)"
        />
        {/* Label sits above the arc's peak, centered horizontally on
            the midpoint between start and end so it reads as a caption
            for the whole feedback path. */}
        <TextLine
          x={(DB_X + DB_W / 2 + FLOW_X + FLOW_W - 60) / 2}
          y={LEARNER.y - 96}
          size={12}
          weight={700}
          fill={C.feedback}
          mono
          raw
          anchor="middle"
        >
          retrain / rollback
        </TextLine>
        <TextLine
          x={(DB_X + DB_W / 2 + FLOW_X + FLOW_W - 60) / 2}
          y={LEARNER.y - 82}
          size={10}
          fill={C.subtext}
          mono
          raw
          anchor="middle"
        >
          promoted checkpoint → predictor
        </TextLine>
      </g>

      {/* Legend (bottom left) */}
      <g transform={`translate(30, ${H - 60})`}>
        <rect
          x={0}
          y={0}
          width={360}
          height={42}
          rx={6}
          fill={C.box}
          stroke={C.stroke}
        />
        <line
          x1={14}
          x2={38}
          y1={15}
          y2={15}
          stroke={C.strokeStrong}
          strokeWidth={1.25}
          markerEnd="url(#arrowHead)"
        />
        <TextLine x={44} y={18} size={10} fill={C.subtext} mono>
          forward data flow
        </TextLine>
        <line
          x1={14}
          x2={38}
          y1={32}
          y2={32}
          stroke={C.feedback}
          strokeWidth={2}
          markerEnd="url(#arrowFeedback)"
        />
        <TextLine x={44} y={35} size={10} fill={C.feedback} mono>
          retrain / deploy-gate feedback loop
        </TextLine>
        <line
          x1={210}
          x2={234}
          y1={15}
          y2={15}
          stroke={C.stroke}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <TextLine x={240} y={18} size={10} fill={C.subtext} mono>
          database read / write
        </TextLine>
      </g>
    </svg>
  );
}
