// Deep-dive content for /projects/spur-2021.

import type { ProjectDetail } from "../types";

export const spur2021: ProjectDetail = {
  problem:
    "Spur is a Redmond consulting firm whose clients are large enterprise technology companies. Consulting work is different in shape from single-product engineering: every engagement is its own miniature product with its own stakeholders, timeline, and deploy target, and every deliverable ships to an external client. The engineering challenge is staying fast and correct while rotating across unrelated codebases week over week.",
  approach:
    "Built React + TypeScript client-facing sites and supporting internal tooling inside the firm's .NET + Azure DevOps source pipeline: feature branches, PR review, build gates, production deploys. On the reporting side, owned Power BI dashboards feeding the firm's weekly executive reviews: underlying data model, DAX measures, visuals, and dataset refresh cadence. Rotated across multiple client engagements in parallel, which meant context-switching between client codebases and style conventions week over week. As a returning intern, contributed to production code on day one rather than re-onboarding.",
  stackRationale: [
    {
      tech: "React + TypeScript",
      why: "The firm's standard stack for client-facing microsites. TypeScript made engagement handoffs cleaner by making the component API an enforced contract between whoever wrote a piece of UI and whoever inherited it.",
    },
    {
      tech: ".NET + Azure DevOps",
      why: "Where Spur's source of truth lived. PR review, build pipelines, and production deploys all ran through the same infrastructure the firm's permanent engineers used, so intern work and non-intern work went through identical gates.",
    },
    {
      tech: "Power BI",
      why: "Executive reporting surface at Spur and at most of its enterprise clients. Owning the dashboard meant owning the data model, DAX measures, and refresh cadence, not just the visuals.",
    },
  ],
  highlights: [
    "Shipped React/TypeScript client microsites to production through Azure DevOps (feature branches, PR review, deploy gates).",
    "Owned Power BI dashboards feeding the firm's weekly executive reviews: data model, DAX measures, and dataset refresh.",
    "Rotated across multiple client engagements in parallel, context-switching between client codebases and style conventions week over week.",
    "Small dev team; every deliverable shipped directly to an external client.",
  ],
};
