// Deep-dive content for /projects/budget-buddy.

import type { ProjectDetail } from "../types";

export const budgetBuddy: ProjectDetail = {
  highlights: [
    "Take-home pay estimator covering federal, state, and FICA taxes, with every parameter adjustable.",
    "Allocation engine works in exact cents, so each paycheck's plan sums to the paycheck with nothing lost to rounding.",
    "Budget rules mix fixed monthly amounts, percentages of take-home, yearly caps that count year-to-date contributions, and a remainder bucket.",
    "Cross-device sync with an offline fallback, so budgets stay available without a connection.",
    "Automated build and deploy pipeline with containerized releases.",
  ],
  figures: [
    {
      src: "/projects/budget-buddy/dashboard.png",
      alt: "Budget Buddy dashboard: $2,476.99 take-home per biweekly paycheck, a per-category plan table with rule, dollars per check, percent of take-home, and yearly projection, and a projected-over-the-year bar chart.",
      caption:
        "Dashboard. Each category's rule (a monthly amount, a percent of take-home, or a yearly cap) resolves to exact cents per paycheck, and the footer reports how much of the check is allocated.",
    },
    {
      src: "/projects/budget-buddy/plan.png",
      alt: "Budget Buddy plan editor: $356.84 left over each paycheck, and draggable category cards for Rent (fixed $1850 per month), Groceries (12% of take-home), and Utilities (fixed $140 per month), each showing its per-check amount and share.",
      caption:
        "Plan editor. Categories are drag-to-reorder and every change saves instantly. An edit that would push the plan past take-home is refused rather than silently adjusted.",
    },
  ],
};
