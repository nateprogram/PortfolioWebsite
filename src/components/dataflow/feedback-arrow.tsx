"use client";

import { useEffect, useState, type RefObject } from "react";
import { FEEDBACK_ARROW_COLORS } from "./tokens";

// SVG overlay that draws the amber retrain-loop arrow from the right-
// column feedback source (backtester checkpoint) up and around to the
// MultiHeadLSTM predictor on the left. This brings back the "yellow arrow
// connecting the retrain loop to the model" visual from the original SVG
// version of the diagram, but driven by measured DOM rects so the curve
// always terminates at the correct cards regardless of content length.
//
// Layout contract:
//   - `containerRef` wraps the entire diagram and establishes the
//     coordinate system (position: relative on the container).
//   - `fromRef` wraps the "promoted checkpoint" source on the right column
//     (top of the arrow: the arrow starts from the *top* of this node).
//   - `toRef` wraps the LSTM predictor on the left column (end of the
//     arrow: terminates at the *right* edge of this node).
//
// The arrow is hidden when the container is narrower than ~960 px. At
// that breakpoint the layout collapses to a single column, the two
// endpoints stack vertically, and a giant curved SVG would look broken.

type Rect = { x: number; y: number; width: number; height: number };

function getLocalRect(
  el: HTMLElement,
  container: HTMLElement
): Rect {
  const e = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return {
    x: e.left - c.left,
    y: e.top - c.top,
    width: e.width,
    height: e.height,
  };
}

// Width threshold below which we hide the arrow. Matches the `lg`
// breakpoint at which the main grid collapses from two columns into one.
const MIN_VISIBLE_WIDTH = 960;

export function FeedbackArrow({
  containerRef,
  fromRef,
  toRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
}) {
  const [geometry, setGeometry] = useState<{
    width: number;
    height: number;
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const measure = () => {
      const cRect = container.getBoundingClientRect();
      // Narrow layouts (single-column): hide the arrow entirely. The two
      // endpoints stack on top of each other and a giant curve would only
      // add visual noise.
      if (cRect.width < MIN_VISIBLE_WIDTH) {
        setGeometry({
          width: cRect.width,
          height: container.scrollHeight,
          path: "",
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          visible: false,
        });
        return;
      }

      const f = getLocalRect(from, container);
      const t = getLocalRect(to, container);

      // Start point: top-center of the retrain-loop's promoted-checkpoint
      // chip on the right column. A tiny negative-Y offset lifts the
      // starting dot a hair clear of the chip border.
      const start = {
        x: f.x + f.width / 2,
        y: f.y - 2,
      };

      // End point: right edge of the LSTM card, vertically centered. An
      // 8 px outside-offset so the arrowhead lands visibly *on* the card
      // edge rather than tunneling into it.
      const end = {
        x: t.x + t.width + 8,
        y: t.y + t.height / 2,
      };

      // Control points for a two-stage Bezier: rise up from the source,
      // arc left across the top of the right column, then sweep down and
      // rightward into the LSTM. `apexY` is above both endpoints so the
      // curve clears any DB / loop cards in the right column.
      const arcHeight = 48;
      const apexY = Math.min(start.y, end.y) - arcHeight;
      const c1 = { x: start.x, y: apexY };
      const c2 = { x: end.x + 28, y: apexY };

      const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;

      setGeometry({
        width: cRect.width,
        height: container.scrollHeight,
        path,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        visible: true,
      });
    };

    // Initial measurement + re-measure whenever layout shifts (window
    // resize, font load, card expand/collapse). ResizeObserver on the
    // container captures all of those in one place.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    // Also observe the endpoints in case they change size without
    // changing the container's size (e.g. LSTM card expanding at the same
    // moment another card collapses by the same amount).
    ro.observe(from);
    ro.observe(to);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, fromRef, toRef]);

  if (!geometry || !geometry.visible) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={geometry.width}
      height={geometry.height}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      aria-hidden
    >
      <defs>
        {/* Arrowhead marker, amber-tinted. `refX` offset backs the head
            into the stroke so the tip lands at the path's end point. */}
        <marker
          id="feedback-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={FEEDBACK_ARROW_COLORS.stroke} />
        </marker>
      </defs>

      {/* Soft outer glow: gives the arrow some presence over busy cards
          without requiring a filter chain. */}
      <path
        d={geometry.path}
        fill="none"
        stroke={FEEDBACK_ARROW_COLORS.strokeFaded}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Main amber stroke. `strokeDasharray` gives it the dashed cadence
          that reads as "feedback / retrain" rather than forward flow, and
          matches the feel of the original diagram. */}
      <path
        d={geometry.path}
        fill="none"
        stroke={FEEDBACK_ARROW_COLORS.stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeDasharray="5 4"
        markerEnd="url(#feedback-arrowhead)"
      />

      {/* Small origin dot on the source so the path has a clear start. */}
      <circle
        cx={geometry.startX}
        cy={geometry.startY}
        r={3}
        fill={FEEDBACK_ARROW_COLORS.stroke}
      />
    </svg>
  );
}
