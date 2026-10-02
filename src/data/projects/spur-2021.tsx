// Deep-dive content for /projects/spur-2021.

import type { ProjectDetail } from "../types";

export const spur2021: ProjectDetail = {
  problem:
    "Spur is a Redmond consulting firm whose clients are large enterprise technology companies. Consulting differs from product work: every engagement is its own small product with its own stakeholders, timeline, and deploy target, and every deliverable goes to a client. The challenge is staying fast and correct while switching between unrelated codebases each week.",
  approach:
    "Built React + TypeScript client sites and internal tools in the firm's .NET + Azure DevOps pipeline: feature branches, PR review, build gates, and production deploys. On the reporting side, I owned the Power BI dashboards behind the firm's weekly executive reviews: the data model, DAX measures, visuals, and refresh schedule. I worked on several client projects at once, switching between their codebases and conventions each week. As a returning intern, I was writing production code from day one.",
  stackRationale: [
    {
      tech: "React + TypeScript",
      why: "The firm's standard stack for client microsites. TypeScript made handoffs between engagements easier, since the type checker enforced each component's API for whoever inherited it.",
    },
    {
      tech: ".NET + Azure DevOps",
      why: "Spur's main source control. PR review, build pipelines, and production deploys ran on the same setup the full-time engineers used, so intern work went through the same checks.",
    },
    {
      tech: "Power BI",
      why: "Spur and most of its clients used it for executive reporting. I owned the data model, DAX measures, and refresh schedule as well as the visuals.",
    },
  ],
  highlights: [
    "Shipped React/TypeScript client microsites to production through Azure DevOps (feature branches, PR review, deploy gates).",
    "Owned Power BI dashboards feeding the firm's weekly executive reviews: data model, DAX measures, and dataset refresh.",
    "Worked on several client projects at once, switching between their codebases and conventions each week.",
    "Small dev team, and every deliverable went straight to a client.",
  ],
};
