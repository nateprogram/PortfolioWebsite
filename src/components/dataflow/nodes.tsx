"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCENT_ICON,
  ACCENT_SURFACE,
  ARROW_STYLES,
  type Accent,
  type ArrowAccent,
} from "./tokens";

// Card primitives used everywhere in the data-flow diagram.
// ---------------------------------------------------------------------------

// Click-to-expand pipeline card. Used for every stage that has further
// detail to drill into (controller, feature engine, analyzers, LSTM, etc.).
// If `details` is empty/absent the card renders as a non-interactive tile
// and the chevron is suppressed, which is the case for purely informational
// stages like the correlation analyzer.
export function FlowNode({
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
  icon?: ReactNode;
  details?: ReadonlyArray<string>;
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetails = (details?.length ?? 0) > 0;

  return (
    <div
      className={cn("rounded-lg border transition-colors", ACCENT_SURFACE[accent])}
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
          <div className={cn("mt-[3px] shrink-0", ACCENT_ICON[accent])}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                // `tracking-wider` (not `widest`) + `break-words` prevents
                // longer titles like "Institutional" from overflowing the
                // compact-card edge at the narrow grid breakpoint.
                "font-mono font-semibold uppercase tracking-wider text-foreground break-words",
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

// Static scraper card. Does NOT expand; the listed items are always
// visible. Each scraper category does the same job (fetch data); the
// *distinguishing* information is the list of sources, so hiding that
// behind a click added friction without adding information. Rendering
// them as always-open removes the "one click expands all five" grid
// alignment issue and communicates at a glance what every category pulls.
export function ScraperCard({
  title,
  count,
  items,
  icon,
}: {
  title: string;
  count: number;
  items: ReadonlyArray<string>;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border transition-colors",
        ACCENT_SURFACE.default
      )}
    >
      <div className="flex items-start gap-2 px-2.5 py-2">
        {icon && (
          <div className={cn("mt-[3px] shrink-0", ACCENT_ICON.default)}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              // Same tracking-wider + break-words treatment as FlowNode so
              // "Institutional" / "Market Context" don't clip.
              "font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground break-words"
            )}
          >
            {title}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {count} scrapers
          </div>
        </div>
      </div>
      <ul className="border-t border-border/50 px-3 py-1.5 text-[11px] leading-snug text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5 py-[1px]">
            <span className="shrink-0 text-muted-foreground/50">•</span>
            <span className="min-w-0 flex-1 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Short vertical arrow connector that sits between stacked FlowNodes.
// The optional label is shown as a tiny monospace caption under the arrow,
// used for "raw streams" above the controller so the eye follows the
// flow even though the stages are visually distinct cards.
export function VerticalArrow({
  label,
  accent = "default",
}: {
  label?: string;
  accent?: ArrowAccent;
}) {
  const styles = ARROW_STYLES[accent];

  return (
    <div className="flex flex-col items-center gap-0.5 py-1" aria-hidden>
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
