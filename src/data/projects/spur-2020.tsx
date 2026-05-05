// Deep-dive content for /projects/spur-2020.

import type { ProjectDetail } from "../types";

export const spur2020: ProjectDetail = {
  problem:
    "Spur distributed a company-wide newsletter to 1,000+ employees every week. The process was fully manual: someone copied content from a structured source into an email template by hand, formatted it, and sent it, every week. Slow, error-prone, and a recurring weekly tax on the comms team. The job was to replace the hand-work with a pipeline that did it correctly, on a schedule, without supervision.",
  approach:
    "Built the pipeline on Microsoft Flow (now Power Automate), the firm's sanctioned automation substrate, which meant IT did not need to approve a new service to run it. Flow pulled newsletter content from a structured source, passed it through an HTML/CSS email template I authored, and fanned out to the 1,000+ employee distribution list on a weekly cadence. The hand-work disappeared. On the side, shipped a refresh of one of the firm's web properties and a handful of smaller email-automation flows covering adjacent manual comms processes.",
  stackRationale: [
    {
      tech: "Microsoft Flow",
      why: "Firm's approved automation substrate. Building on top of Flow meant zero procurement friction, since IT already trusted it. Trades code flexibility for deployment velocity; for a weekly newsletter, that trade is the right one.",
    },
    {
      tech: "HTML + CSS (email templates)",
      why: "Email rendering is famously ancient (Outlook, Gmail, and mobile clients all differ). Hand-rolling the template with well-known patterns was more reliable than reaching for a framework that might render cleanly in the browser and break in a recipient's mail client.",
    },
    {
      tech: "Visual Studio + Java",
      why: "The firm's existing tooling. Companion tools were written against the stack the engagement team was already using.",
    },
    {
      tech: "Excel",
      why: "Where the source content and distribution lists lived. Flow talks to Excel natively over Graph, so the pipeline could be a single declarative chain without an intermediate store.",
    },
  ],
  highlights: [
    "Microsoft Flow pipeline delivered the weekly internal newsletter to 1,000+ employees, replacing an entirely manual process.",
    "Authored the HTML/CSS email template that rendered newsletter content consistently across Outlook, web, and mobile clients.",
    "Shipped a refresh of one of the firm's web properties and several smaller email-automation flows for internal comms.",
  ],
};
