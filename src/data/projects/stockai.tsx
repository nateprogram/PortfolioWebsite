// Deep-dive content for /projects/stockai.

import type { ProjectDetail } from "../types";

export const stockai: ProjectDetail = {
  problem:
    "Three problems sink most ML trading systems. **Leakage**: time-series cross-validation is easy to get wrong, and standard K-Fold lets tomorrow's data train yesterday's model. **Drift**: markets change regime faster than weekly bars, and a model trained on a trending market breaks once volatility changes. **Predicting zero**: a loss minimized on raw returns learns that 'no move' is the safest guess, so the model scores well on paper and forecasts nothing. StockAI is a research platform built to make those three mistakes hard to make.",
  approach:
    "**Ingest.** 23 scrapers pull from five kinds of source, each on its own schedule: market data (yfinance, Alpha Vantage), Reddit sentiment (PRAW on r/wallstreetbets, r/stocks, and r/investing), SEC filings, macro indicators, and per-ticker news. Data lands in three tiers: SQLite for live reads, Parquet for training, and compressed archives for long backtests.\n\n**Transform.** A FeatureEngine derives 148 features from the raw data: rolling volatility cones, regime-adjusted momentum, cross-asset correlation changes, sentiment z-scores, microstructure proxies, and lagged macro surprises. Correlation-based selection drops redundant inputs on each run.\n\n**Regime.** An HMM (hmmlearn) over returns and realized volatility labels the current market regime: bull trend, bear trend, high-volatility chop, or low-volatility grind. The label is a feature, and some prediction heads only run in certain regimes.\n\n**Predict.** A MultiHeadLSTM shares one sequence encoder across 10 prediction heads, one per timeframe from minutes to weeks. A feature-attention module tracks each feature's contribution with an EMA (α=0.15, clipped to [0.5, 2.0]) and scales its input weight on the next pass, so a feature that stops mattering in the current regime gets down-weighted.\n\n{{code:feature-attention}}\n\n**Validate.** Training uses Lopez de Prado's **Purged K-Fold** cross-validation with embargo gaps around each fold, so future data never reaches the training set. Scoring checks whether the predicted direction was right and breaks the result out by regime. A model has to do well in more than one regime.\n\n{{code:purged-kfold}}\n\n**Deploy gate.** A new model replaces the live one only if it beats it on out-of-fold direction accuracy and on per-regime accuracy. If the live model gets worse on either for N windows in a row, the system rolls back to the previous checkpoint.\n\n{{code:rollback-gate}}\n\n**Serve.** A FastAPI backend streams predictions, feature attention weights, the current regime, and validator stats over a WebSocket to a live dashboard. The same process has a REST API for batch backtests.",
  stackRationale: [
    {
      tech: "MultiHeadLSTM (shared encoder, 10 heads)",
      why: "One encoder learns the shared sequence representation, and each timeframe's head specializes. It's cheaper to train than 10 separate models, and because the timeframes share one representation, their predictions can be combined.",
    },
    {
      tech: "Closed-loop feature attention (EMA α=0.15)",
      why: "Regime shifts change which inputs matter. The attention module tracks each feature's contribution and rescales its input weight on the next pass, without a full retrain. Weights stay within [0.5, 2.0], so no input can drop to zero or take over.",
    },
    {
      tech: "HMM regime detection (hmmlearn)",
      why: "Direction accuracy averaged across regimes is misleading: a model can score 55% overall while hitting 70% in one regime and 40% in another. The HMM label lets the validator score each regime separately, and it limits some heads to the regimes they were trained for.",
    },
    {
      tech: "Purged K-Fold + embargo (Lopez de Prado)",
      why: "Standard K-Fold leaks future data into training when targets span overlapping bars. Purging drops the overlapping observations, and the embargo gap blocks leakage after the test window. Without both, backtest numbers come out too high.",
    },
    {
      tech: "3-tier storage (SQLite / Parquet / compressed archive)",
      why: "Live reads come from SQLite (fast, single writer). Training reads columnar Parquet (10-100× faster scans on numeric features). Long backtests and audits read compressed archives.",
    },
    {
      tech: "Retrain-with-rollback",
      why: "Every new model has to beat the live one on two metrics before it replaces it, and if the live model keeps getting worse, the system rolls back to the previous checkpoint.",
    },
    {
      tech: "FastAPI + WebSocket dashboard",
      why: "Predictions, attention weights, the regime label, and validator stats stream live over a WebSocket, so I can check a bad hour of signals on the dashboard without opening a notebook.",
    },
  ],
  highlights: [
    "~11,500 lines of Python across 42 modules covering ingest, feature engineering, regime detection, modeling, validation, and live serving.",
    "23 scrapers across 5 kinds of source (market data, Reddit sentiment, SEC filings, macro indicators, per-ticker news), each on its own schedule.",
    "148 features, with correlation-based selection dropping redundant inputs on each run.",
    "A MultiHeadLSTM with one shared encoder predicts 10 timeframes, from minutes to weeks.",
    "Pre-training runs in three phases (daily, hourly, minute). The encoder carries over between phases with new per-timeframe heads each time, so the longer timeframes give the shorter ones a head start.",
    "Feature attention (EMA α=0.15, clipped to [0.5, 2.0]) rescales input weights as regimes shift, without a full retrain.",
    "HMM regime detection limits some heads to certain regimes and drives per-regime scoring, so a model has to do well in more than one regime to go live.",
    "Every reported number comes from Purged K-Fold cross-validation with embargo gaps (Lopez de Prado), which keeps future data out of training.",
    "Retraining with rollback: a new model must beat the live one on out-of-fold direction accuracy and per-regime accuracy, and a live model that keeps getting worse is rolled back.",
    "Three storage tiers: SQLite for live reads, Parquet for training, and compressed archives for long backtests.",
    "FastAPI + WebSocket dashboard streams predictions, feature attention weights, current regime label, and validator stats live.",
  ],
  figures: [
    {
      diagram: "stockai-dataflow",
      alt: "V6 data flow. 23 scrapers in 5 categories (price/volume, market context, social/news, institutional, economic/alt) feed a Working Data Controller. A Feature Engine derives 148 features used by three parallel analyzers (order flow, sentiment, smart money) plus a correlation analyzer. A signal aggregator feeds an HMM regime detector and the 10-head MultiHeadLSTM predictor. A 6-check prediction validator gates the FastAPI WebSocket dashboard. A database layer on the right connects to several stages (stores real-time data, reads history, stores signals, stores checkpoints). A continuous learner and a Purged K-Fold backtester form the retrain and deploy gate, with a white feedback arrow back into the predictor.",
      caption:
        "V6 data flow. Peers sit side by side: the 5 scraper categories share a row and don't talk to each other, and so do the 3 analyzers. The database layer sits to the right so its links to several stages are visible. The white arrow is the feedback loop: the continuous learner writes candidates, the backtester decides which go live, and the promoted checkpoint returns to the predictor.",
    },
  ],
  codeSnippets: [
    {
      id: "feature-attention",
      title: "Closed-loop feature attention (EMA, bounded)",
      description:
        "How the model adapts between retrains. Each feature's contribution is tracked with an EMA (α=0.15), normalized against the rolling mean, and clipped to [0.5, 2.0], so one bad batch can't zero out an input or let one input dominate the loss.",
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
        "For each test fold, training observations whose label window overlaps the test window are dropped, and a gap after the test window keeps later data out of training.",
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
        "A new model replaces the live one only if it wins on two metrics: out-of-fold direction accuracy and worst-regime accuracy, so a model that does well in one regime and badly in another can't go live. A live model that keeps getting worse is rolled back.",
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
