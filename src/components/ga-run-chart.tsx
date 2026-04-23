"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import gaData from "@/data/ga-run.json";

// Interactive scatter plot of every game the genetic AI played.
// x: generation (0..16). y: score (time remaining in seconds on win;
// -99 sentinel = loss). Hover any dot to see its exact value.
//
// Rationale (from the user): replace the static PNG with something where
// people can hover specific points, and label the axes.

type Point = {
  gen: number;
  idx: number; // 0-based index within that generation
  score: number;
  win: boolean;
};

const LOSS_SENTINEL = -99;

const POINTS: ReadonlyArray<Point> = gaData.generations.flatMap((g) =>
  g.scores.map((s, i) => ({
    gen: g.gen,
    idx: i,
    score: s,
    win: s > 0,
  }))
);

// Best *winning* score per generation (trend line).
const BEST_PER_GEN: ReadonlyArray<{ gen: number; best: number }> =
  gaData.generations
    .map((g) => {
      const wins = g.scores.filter((s) => s > 0);
      return wins.length > 0
        ? { gen: g.gen, best: Math.max(...wins) }
        : null;
    })
    .filter((x): x is { gen: number; best: number } => x !== null);

// ----- coordinate math -----
const W = 820;
const H = 460;
const PAD = { top: 32, right: 28, bottom: 60, left: 72 };

const X_MIN = -0.5;
const X_MAX = 16.5;
const Y_MIN = -120;
const Y_MAX = 440;

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function sx(gen: number): number {
  return PAD.left + ((gen - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function sy(score: number): number {
  return PAD.top + ((Y_MAX - score) / (Y_MAX - Y_MIN)) * PLOT_H;
}

const X_TICKS = [0, 2, 4, 6, 8, 10, 12, 14, 16];
const Y_TICKS = [-100, 0, 100, 200, 300, 400];

const C = {
  text: "#e5e7eb",
  subtext: "#94a3b8",
  muted: "#64748b",
  grid: "rgba(148,163,184,0.15)",
  axis: "rgba(148,163,184,0.45)",
  threshold: "#f59e0b",
  zero: "rgba(148,163,184,0.4)",
  win: "#38bdf8",
  winHover: "#bae6fd",
  loss: "#f87171",
  lossHover: "#fecaca",
  trend: "#22d3ee",
} as const;

export function GaRunChart({ className }: { className?: string }) {
  const [hovered, setHovered] = useState<Point | null>(null);

  // Best overall, for the summary badge.
  const bestOverall = Math.max(...BEST_PER_GEN.map((b) => b.best));
  const totalGames = POINTS.length;
  const totalLosses = POINTS.filter((p) => !p.win).length;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Scatter plot of ${totalGames} games the genetic AI played across ${gaData.generations.length} generations. Best score: ${bestOverall.toFixed(2)}, above the 400-second three-star threshold. ${totalLosses} losses in the run.`}
        className="block w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Plot frame */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="rgba(255,255,255,0.015)"
          stroke={C.axis}
          strokeWidth={1}
        />

        {/* Horizontal gridlines */}
        {Y_TICKS.map((t) => (
          <line
            key={`gy-${t}`}
            x1={PAD.left}
            x2={PAD.left + PLOT_W}
            y1={sy(t)}
            y2={sy(t)}
            stroke={C.grid}
            strokeWidth={1}
          />
        ))}

        {/* Vertical gridlines */}
        {X_TICKS.map((t) => (
          <line
            key={`gx-${t}`}
            x1={sx(t)}
            x2={sx(t)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke={C.grid}
            strokeWidth={1}
          />
        ))}

        {/* Zero baseline (win/loss separator) */}
        <line
          x1={PAD.left}
          x2={PAD.left + PLOT_W}
          y1={sy(0)}
          y2={sy(0)}
          stroke={C.zero}
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        <text
          x={PAD.left + 8}
          y={sy(0) - 4}
          fill={C.muted}
          fontSize={10}
          fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
        >
          0 · win / loss
        </text>

        {/* 3-star threshold */}
        <line
          x1={PAD.left}
          x2={PAD.left + PLOT_W}
          y1={sy(400)}
          y2={sy(400)}
          stroke={C.threshold}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <text
          x={PAD.left + PLOT_W - 8}
          y={sy(400) - 5}
          fill={C.threshold}
          fontSize={11}
          fontWeight={600}
          textAnchor="end"
          fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
        >
          3★ threshold (400)
        </text>

        {/* Y-axis ticks + labels */}
        {Y_TICKS.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={PAD.left - 5}
              x2={PAD.left}
              y1={sy(t)}
              y2={sy(t)}
              stroke={C.axis}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 10}
              y={sy(t) + 4}
              fill={C.subtext}
              fontSize={11}
              textAnchor="end"
              fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
            >
              {t}
            </text>
          </g>
        ))}

        {/* X-axis ticks + labels */}
        {X_TICKS.map((t) => (
          <g key={`x-${t}`}>
            <line
              x1={sx(t)}
              x2={sx(t)}
              y1={PAD.top + PLOT_H}
              y2={PAD.top + PLOT_H + 5}
              stroke={C.axis}
              strokeWidth={1}
            />
            <text
              x={sx(t)}
              y={PAD.top + PLOT_H + 20}
              fill={C.subtext}
              fontSize={11}
              textAnchor="middle"
              fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis titles */}
        <text
          x={PAD.left + PLOT_W / 2}
          y={H - 14}
          fill={C.text}
          fontSize={13}
          fontWeight={600}
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        >
          Generation
        </text>
        <text
          x={18}
          y={PAD.top + PLOT_H / 2}
          fill={C.text}
          fontSize={13}
          fontWeight={600}
          textAnchor="middle"
          transform={`rotate(-90, 18, ${PAD.top + PLOT_H / 2})`}
          fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        >
          Score (seconds remaining · −99 = loss)
        </text>

        {/* Best-per-gen trend line (wins only) */}
        {BEST_PER_GEN.length > 1 && (
          <polyline
            points={BEST_PER_GEN.map((b) => `${sx(b.gen)},${sy(b.best)}`).join(
              " "
            )}
            fill="none"
            stroke={C.trend}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {/* Best-per-gen markers */}
        {BEST_PER_GEN.map((b) => (
          <circle
            key={`best-${b.gen}`}
            cx={sx(b.gen)}
            cy={sy(b.best)}
            r={3.5}
            fill={C.trend}
            stroke="#0f172a"
            strokeWidth={1.25}
            pointerEvents="none"
          />
        ))}

        {/* Per-game scatter points (hoverable). Invisible larger hit circle
            wraps each visible dot so mouseover isn't brittle. */}
        {POINTS.map((p, i) => {
          const cx = sx(p.gen + (p.idx - 5) * 0.045); // jitter within generation
          const cy = sy(p.score);
          const isHovered =
            hovered !== null &&
            hovered.gen === p.gen &&
            hovered.idx === p.idx;
          const color = p.win
            ? isHovered
              ? C.winHover
              : C.win
            : isHovered
            ? C.lossHover
            : C.loss;
          return (
            <g key={`pt-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 3}
                fill={color}
                stroke="#0f172a"
                strokeWidth={1}
                opacity={p.win ? 0.9 : 1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill="transparent"
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() =>
                  setHovered((h) =>
                    h && h.gen === p.gen && h.idx === p.idx ? null : h
                  )
                }
                onFocus={() => setHovered(p)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`Generation ${p.gen}, game ${p.idx}: ${
                  p.win ? `${p.score.toFixed(2)} seconds remaining` : "loss"
                }`}
                style={{ cursor: "pointer", outline: "none" }}
              />
            </g>
          );
        })}

        {/* Legend (top-left inside plot) */}
        <g transform={`translate(${PAD.left + 12}, ${PAD.top + 12})`}>
          <rect
            x={0}
            y={0}
            width={196}
            height={66}
            rx={6}
            fill="rgba(15,23,42,0.75)"
            stroke={C.axis}
            strokeWidth={1}
          />
          <circle cx={14} cy={16} r={3.5} fill={C.win} />
          <text
            x={26}
            y={19}
            fill={C.subtext}
            fontSize={10.5}
            fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
          >
            win (hover for value)
          </text>
          <circle cx={14} cy={34} r={3.5} fill={C.loss} />
          <text
            x={26}
            y={37}
            fill={C.subtext}
            fontSize={10.5}
            fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
          >
            loss (sentinel −99)
          </text>
          <line
            x1={8}
            x2={22}
            y1={52}
            y2={52}
            stroke={C.trend}
            strokeWidth={2}
          />
          <text
            x={26}
            y={55}
            fill={C.subtext}
            fontSize={10.5}
            fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
          >
            best of each generation
          </text>
        </g>

        {/* Summary badge (top-right) */}
        <g transform={`translate(${PAD.left + PLOT_W - 168}, ${PAD.top + 12})`}>
          <rect
            x={0}
            y={0}
            width={156}
            height={48}
            rx={6}
            fill="rgba(15,23,42,0.75)"
            stroke={C.axis}
            strokeWidth={1}
          />
          <text
            x={12}
            y={20}
            fill={C.subtext}
            fontSize={10}
            fontFamily="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
          >
            BEST SCORE
          </text>
          <text
            x={12}
            y={38}
            fill={C.threshold}
            fontSize={16}
            fontWeight={700}
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
          >
            {bestOverall.toFixed(2)} ★
          </text>
        </g>
      </svg>

      {/* Tooltip — positioned as % of wrapper so it tracks the scaled SVG. */}
      {hovered && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 rounded-md border border-border bg-background/95 px-2.5 py-1.5 text-xs shadow-lg ring-1 ring-inset ring-white/[0.05]",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          )}
          style={{
            left: `${(sx(hovered.gen + (hovered.idx - 5) * 0.045) / W) * 100}%`,
            top: `${(sy(hovered.score) / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Gen {hovered.gen} · Game {hovered.idx}
          </div>
          <div
            className={cn(
              "font-semibold",
              hovered.win ? "text-sky-300" : "text-red-300"
            )}
          >
            {hovered.win
              ? `${hovered.score.toFixed(2)} s remaining`
              : "Loss"}
          </div>
          {hovered.win && hovered.score >= 400 && (
            <div className="text-[10px] font-semibold text-amber-400">
              ★★★ above 3-star threshold
            </div>
          )}
        </div>
      )}
    </div>
  );
}
