// Deep-dive content for /projects/budget-buddy.

import type { ProjectDetail } from "../types";

export const budgetBuddy: ProjectDetail = {
  highlights: [
    "Take-home pay estimator covering federal, state, and FICA taxes, with every parameter adjustable.",
    "Amounts are tracked in cents, so each plan adds up to the paycheck with no rounding error.",
    "Budget rules mix fixed monthly amounts, percentages of take-home, yearly caps that count year-to-date contributions, and a remainder bucket.",
    "Syncs across devices and works offline.",
    "Automated build and deploy pipeline with Docker releases.",
  ],
  figures: [
    {
      src: "/projects/budget-buddy/dashboard.png",
      alt: "Budget Buddy dashboard: $2,476.99 take-home per biweekly paycheck, a per-category plan table with rule, dollars per check, percent of take-home, and yearly projection, and a projected-over-the-year bar chart.",
      caption:
        "Dashboard. Each category's rule (a monthly amount, a percent of take-home, or a yearly cap) becomes a per-paycheck amount, and the footer shows how much of the check is allocated.",
    },
    {
      src: "/projects/budget-buddy/plan.png",
      alt: "Budget Buddy plan editor: $356.84 left over each paycheck, and draggable category cards for Rent (fixed $1850 per month), Groceries (12% of take-home), and Utilities (fixed $140 per month), each showing its per-check amount and share.",
      caption:
        "Plan editor. Categories can be dragged to reorder, and changes save right away. An edit that would push the plan past take-home pay is refused.",
    },
  ],
};
