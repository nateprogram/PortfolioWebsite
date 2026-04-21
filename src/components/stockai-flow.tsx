import { Fragment } from "react";
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Database,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Undo2,
} from "lucide-react";

const STAGES = [
  {
    icon: Database,
    label: "Ingest",
    detail: "23 scrapers → 3-tier store",
    sub: "Market, Reddit, SEC, macro, news",
  },
  {
    icon: Sliders,
    label: "Transform",
    detail: "148 engineered features",
    sub: "Correlation-pruned per run",
  },
  {
    icon: Brain,
    label: "Predict",
    detail: "MultiHeadLSTM · 10 heads",
    sub: "HMM regime gate",
  },
  {
    icon: ShieldCheck,
    label: "Gate",
    detail: "Purged K-Fold validation",
    sub: "Retrain + rollback ladder",
  },
  {
    icon: Radio,
    label: "Serve",
    detail: "FastAPI + WebSocket",
    sub: "Live dashboard",
  },
] as const;

export default function StockAIFlow() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        Data flow
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-4 sm:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <Fragment key={stage.label}>
                <div className="flex flex-1 flex-col gap-1.5 rounded-lg border border-border bg-card/60 p-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="size-4 text-foreground/80"
                      aria-hidden
                    />
                    <span className="font-mono text-[11px] uppercase tracking-widest text-foreground/80">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium leading-snug text-foreground/90">
                    {stage.detail}
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    {stage.sub}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className="flex items-center justify-center text-muted-foreground"
                    aria-hidden
                  >
                    <ArrowRight className="hidden size-4 md:block" />
                    <ArrowDown className="size-4 md:hidden" />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <RefreshCw
              className="mt-0.5 size-4 shrink-0 text-foreground/70"
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/80">
                Feature-attention loop
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                Predict → Transform. Per-feature contribution tracked via EMA
                (α=0.15, clipped [0.5, 2.0]); input weights rescale live so
                regime shifts don&apos;t require a retrain.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Undo2
              className="mt-0.5 size-4 shrink-0 text-foreground/70"
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/80">
                Rollback loop
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                Gate → Predict. Candidates must beat the incumbent on direction
                accuracy AND regime-stratified accuracy; sustained live
                degradation auto-rolls back to the prior checkpoint.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
