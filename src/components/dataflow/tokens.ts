// Shared visual tokens for the V6 data-flow diagram.
//
// Every card, arrow and legend swatch reads from these tables, so a change
// to an accent color here ripples everywhere that accent is used. The goal
// is: "one change on tokens.ts changes all", with no color literals sprinkled
// across the component files.
//
// Each accent represents a *semantic* lane in the pipeline, not just a
// color:
//   - default   neutral pipeline stage
//   - model     cyan lane (feature engine, LSTM predictor, model path)
//   - feedback  white lane (retrain / rollback loop: the white-hot arrow)
//   - db        slate lane (database / storage)
//   - gate      emerald lane (validators / deploy gates)
//
// The model lane is the site's own cyan, and the feedback loop is drawn
// in the white-hot core of the same light, not orange: in the site's
// TRON theme orange marks game work only (see globals.css).
//
// Opacities intentionally stay low (0.04 - 0.10) so the accent is a soft
// wash rather than a filled button.

export type Accent = "default" | "model" | "feedback" | "db" | "gate";

// Tailwind classes applied to the card surface (border + fill + hover).
export const ACCENT_SURFACE: Record<Accent, string> = {
  default:
    "border-border bg-card/40 hover:bg-card/70 hover:border-border/80",
  model:
    "border-brand/30 bg-brand/[0.05] hover:bg-brand/[0.10] hover:border-brand/50",
  feedback:
    "border-brand-2/40 bg-brand-2/[0.05] hover:bg-brand-2/[0.09] hover:border-brand-2/60",
  db: "border-slate-400/30 bg-slate-500/[0.05] hover:bg-slate-500/[0.10] hover:border-slate-400/50",
  gate: "border-emerald-500/30 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.10] hover:border-emerald-500/50",
};

// Icon-tint class. Pairs with ACCENT_SURFACE so the icon sits on its lane.
export const ACCENT_ICON: Record<Accent, string> = {
  default: "text-muted-foreground/80",
  model: "text-brand",
  feedback: "text-brand-2",
  db: "text-slate-600 dark:text-slate-300",
  gate: "text-emerald-600 dark:text-emerald-400",
};

// Flow-arrow styling. We only need a subset of accents for arrows
// (default / model / feedback) because db and gate lanes don't have
// flow-arrow segments in the current layout.
export type ArrowAccent = "default" | "model" | "feedback";

export const ARROW_STYLES: Record<
  ArrowAccent,
  { line: string; icon: string }
> = {
  default: { line: "bg-border", icon: "text-muted-foreground/60" },
  model: {
    line: "bg-brand/40",
    icon: "text-brand",
  },
  feedback: {
    line: "bg-brand-2/50",
    icon: "text-brand-2",
  },
};

// Raw stroke colors consumed by the SVG feedback-arrow overlay. Kept as
// rgb triples so the SVG can use `rgb(... / <alpha>)` for the gradient
// fade without needing a separate CSS-variable hop.
export const FEEDBACK_ARROW_COLORS = {
  // The white-hot core of the theme's light lines (--brand-2).
  stroke: "rgb(232 250 255)",
  strokeFaded: "rgb(232 250 255 / 0.25)",
};
