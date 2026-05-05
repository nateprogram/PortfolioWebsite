// Deep-dive content for /projects/stockai.

import type { ProjectDetail } from "../types";

export const stockai: ProjectDetail = {
  problem:
    "Three traps kill most ML trading systems before they can say anything useful. **Leakage**, because time-series cross-validation is easy to get wrong; standard K-Fold lets tomorrow's information teach yesterday's model. **Drift**, because markets switch regime faster than weekly bars and a model trained on trending tape silently breaks once volatility flips. And the **'predict zero' attractor**, where a loss function minimized on raw returns learns that the safest bet is always 'no move'. The model looks great on paper and forecasts nothing. The goal wasn't to hit a magic accuracy number; it was to build an end-to-end research platform that makes those three failure modes hard, not easy.",
  approach:
    "**Ingest.** 23 scrapers pull from five source families (market data via yfinance and Alpha Vantage, Reddit sentiment via PRAW across r/wallstreetbets / r/stocks / r/investing, SEC filings, macro indicators, and per-ticker news) on independent refresh cadences. Each scraper writes to a 3-tier store: hot SQLite for live reads, warm Parquet for model training, cold compressed archives for long-range backtests.\n\n**Transform.** A FeatureEngine derives 148 engineered features from the raw ingest: rolling volatility cones, regime-adjusted momentum, cross-asset correlation deltas, sentiment z-scores, microstructure proxies, and lagged macro surprises. Correlation-based feature selection prunes redundant inputs per run.\n\n**Regime.** An HMM (hmmlearn) over returns and realized-vol classifies the current regime into one of a small set of states (bull-trending, bear-trending, high-vol chop, low-vol grind). The regime label is both a feature and a gate; certain heads only fire in certain regimes.\n\n**Predict.** A MultiHeadLSTM shares a single sequence encoder across 10 per-timeframe prediction heads (minutes through weeks). A closed-loop feature-attention module tracks each feature's contribution via EMA (α=0.15, output clipped to [0.5, 2.0]) and scales the next forward pass's input weights live, so a feature that stops mattering in the current regime gets quietly down-weighted instead of dominating the loss.\n\n{{code:feature-attention}}\n\n**Validate.** Training uses Lopez de Prado's **Purged K-Fold** cross-validation with embargo zones on either side of each fold, which is the only way to honestly score a time-series model. Evaluation is direction-aware (hit rate on sign) and regime-stratified. A model is only 'good' if it's good in more than one regime.\n\n{{code:purged-kfold}}\n\n**Deploy gate.** A retrain-with-rollback ladder: every new model has to beat the incumbent on out-of-fold direction accuracy AND on regime-stratified accuracy before promotion. If the live model degrades on either axis for N consecutive windows, the system rolls back to the prior checkpoint. There is no silent redeploy.\n\n{{code:rollback-gate}}\n\n**Serve.** A FastAPI backend streams predictions, feature attention weights, current regime label, and validator stats over a WebSocket to a live dashboard. The same process exposes a REST surface for batch backtests.",
  stackRationale: [
    {
      tech: "MultiHeadLSTM (shared encoder, 10 heads)",
      why: "One encoder learns the general sequence representation once; per-timeframe heads specialize. Cheaper to train than 10 separate models and gives consistent latent representations across horizons, which is what makes cross-timeframe ensembling honest.",
    },
    {
      tech: "Closed-loop feature attention (EMA α=0.15)",
      why: "Regime shifts change which inputs matter. Rather than retrain from scratch every week, the attention module watches per-feature contribution and rescales the next pass's input weights live. Bounded to [0.5, 2.0] so it can't collapse or explode.",
    },
    {
      tech: "HMM regime detection (hmmlearn)",
      why: "Direction accuracy averaged across regimes is a lie. A model can look 55% while being 70% in one regime and 40% in another. The HMM label feeds the validator so evaluation is regime-stratified, and gates a subset of heads so regime-specific signals don't leak into the wrong state.",
    },
    {
      tech: "Purged K-Fold + embargo (Lopez de Prado)",
      why: "Standard K-Fold leaks future information into training folds on overlapping-bar targets. Purging drops overlapping observations; the embargo window blocks post-test leakage. Without both, every backtest number is optimistic fiction.",
    },
    {
      tech: "3-tier storage (SQLite / Parquet / compressed archive)",
      why: "Live path reads from SQLite (low-latency, single-writer). Training reads columnar Parquet (10-100× faster scan on numeric features). Long-range backtests and audits read from compressed archives. Each tier's cost profile matches its access pattern.",
    },
    {
      tech: "Retrain-with-rollback",
      why: "A model that silently degrades in production is worse than no model. Every candidate has to beat the incumbent on two metrics before promotion, and sustained live degradation triggers automatic rollback to the prior checkpoint.",
    },
    {
      tech: "FastAPI + WebSocket dashboard",
      why: "Research platforms with no frontend stop being used. Streaming predictions, attention weights, regime label, and validator stats live over a WebSocket means diagnosing a bad hour of signals is a glance, not a notebook run.",
    },
  ],
  highlights: [
    "~11,500 lines of Python across 42 modules covering ingest, feature engineering, regime detection, modeling, validation, and live serving.",
    "23 scrapers pulling from 5 source families (market data, Reddit sentiment, SEC filings, macro indicators, per-ticker news) on independent refresh cadences.",
    "148 engineered features with correlation-based selection pruning redundant inputs per run.",
    "MultiHeadLSTM shared-encoder architecture predicts 10 timeframes simultaneously from minutes to weeks.",
    "3-phase progressive pre-training (Daily → Hourly → Minute) transfers the LSTM encoder forward between phases with fresh per-timeframe heads at each stage. Longer timeframes bootstrap representation for shorter ones.",
    "Closed-loop feature attention via EMA (α=0.15, clipped [0.5, 2.0]) rescales input weights live as regimes shift, with no full retrain required.",
    "HMM-based regime detection gates per-regime heads and drives regime-stratified evaluation so a model must be good in more than one regime to promote.",
    "Purged K-Fold cross-validation with embargo zones (Lopez de Prado) is the backbone of every reported number. It's the only time-series CV that doesn't leak.",
    "Retrain-with-rollback ladder: candidates must beat the incumbent on out-of-fold direction accuracy AND regime-stratified accuracy before promotion; sustained live degradation auto-rolls back.",
    "3-tier storage (SQLite hot / Parquet warm / compressed archive cold) matches each access pattern's cost profile.",
    "FastAPI + WebSocket dashboard streams predictions, feature attention weights, current regime label, and validator stats live.",
  ],
  figures: [
    {
      diagram: "stockai-dataflow",
      alt: "V6 data flow. 23 scrapers in 5 peer categories (price/volume, market context, social/news, institutional, economic/alt) feed a Working Data Controller. A Feature Engine derives 148 features consumed by three parallel analyzers (order flow, sentiment, smart money) plus a correlation analyzer. A signal aggregator feeds an HMM regime detector and the MultiHeadLSTM predictor with 10 heads. A 6-check prediction validator gates the FastAPI WebSocket dashboard. A database layer off to the right interacts with multiple stages (stores real-time, reads historical, stores signals, stores checkpoints). A continuous learner and Purged K-Fold backtester form the retrain and deploy gate, with an explicit amber feedback arrow back into the predictor.",
      caption:
        "V6 data flow, positional. Peers sit side-by-side (the 5 scraper categories share a level and don't cross-talk; the 3 analyzers share a level). The database layer is off to the right so its multi-layer interactions are visible. The amber arrow is the explicit feedback loop: the continuous learner writes candidates, the backtester gates promotion, and the promoted checkpoint returns to the predictor.",
    },
  ],
  codeSnippets: [
    {
      id: "feature-attention",
      title: "Closed-loop feature attention (EMA, bounded)",
      description:
        "The one live adaptation the model does without retraining. Each feature's contribution is tracked with an EMA (α=0.15), normalized against the rolling mean, and clipped to [0.5, 2.0] so a bad batch can't collapse an input to zero or let a hot input dominate the loss.",
      language: "python",
      code: `class FeatureAttention:
    def __init__(self, n_features: int, alpha: float = 0.15,
                 lo: float = 0.5, hi: float = 2.0):
        self.alpha, self.lo, self.hi = alpha, lo, hi
        self.ema  = np.ones(n_features)     # per-feature weight
        self.hist = np.ones(n_features)     # EMA of |contribution|

    def update(self, contrib: np.ndarray) -> np.ndarray:
        """
        contrib[i] = running importance score for feature i
        (e.g. |grad_i * x_i| averaged over the last batch).
        Returns the weight to scale feature i by on the next pass.
        """
        self.hist = (1 - self.alpha) * self.hist \\
                  + self.alpha * np.abs(contrib)
        mean   = self.hist.mean() + 1e-9
        target = self.hist / mean                      # >1 = important
        self.ema = np.clip(target, self.lo, self.hi)   # bound rescale
        return self.ema`,
    },
    {
      id: "purged-kfold",
      title: "Purged K-Fold with embargo (Lopez de Prado)",
      description:
        "The only time-series CV that doesn't lie. For each test fold we purge training observations whose label window overlaps the test window, then embargo a gap on the right so leakage after the test can't bleed back into training.",
      language: "python",
      code: `def purged_kfold_indices(n: int, k: int,
                         label_h: int, embargo: int):
    fold_size = n // k
    for i in range(k):
        test_start = i * fold_size
        test_end   = test_start + fold_size
        test_idx   = np.arange(test_start, test_end)

        # Purge: drop training points whose label window
        # (t .. t + label_h) overlaps the test fold.
        train_idx = np.arange(n)
        train_idx = train_idx[(train_idx + label_h < test_start)
                              | (train_idx >= test_end)]

        # Embargo: drop the first 'embargo' training points
        # immediately after the test fold to block post-test leakage.
        train_idx = train_idx[(train_idx < test_start)
                              | (train_idx >= test_end + embargo)]

        yield train_idx, test_idx`,
    },
    {
      id: "rollback-gate",
      title: "Retrain-with-rollback promotion gate",
      description:
        "A candidate only replaces the incumbent if it wins on two metrics: out-of-fold direction accuracy AND worst-regime accuracy (so a model that shines in one regime but crumbles in another can't promote). Sustained live degradation auto-rolls back.",
      language: "python",
      code: `def promote_if_better(candidate, incumbent,
                      folds, regimes) -> bool:
    c_dir = oof_direction_accuracy(candidate, folds)
    i_dir = oof_direction_accuracy(incumbent, folds)

    c_reg = regime_stratified_accuracy(candidate, folds, regimes)
    i_reg = regime_stratified_accuracy(incumbent, folds, regimes)

    # Must beat incumbent on BOTH axes before replacing.
    if c_dir > i_dir and min(c_reg.values()) > min(i_reg.values()):
        deploy(candidate)
        log.info("PROMOTE: dir %.3f -> %.3f, "
                 "worst-regime %.3f -> %.3f",
                 i_dir, c_dir,
                 min(i_reg.values()), min(c_reg.values()))
        return True
    return False


def live_rollback_check(live, window: int = 5):
    # If live direction accuracy has fallen below the prior
    # checkpoint's validation score for 'window' consecutive
    # days, roll back to the prior checkpoint.
    recent = live.recent_daily_accuracy(window)
    if all(a < live.prior_checkpoint.val_accuracy for a in recent):
        live.rollback()`,
    },
  ],
};
