// Deep-dive content for /projects/spur-2020.

import type { ProjectDetail } from "../types";

export const spur2020: ProjectDetail = {
  problem:
    "Spur sent a company-wide newsletter to 10,000+ employees every week, and it was assembled by hand: someone copied content from a structured source into an email template, formatted it, and sent it. It was slow and error-prone. My job was to automate it so it ran on a schedule with no one watching.",
  approach:
    "I built the pipeline on Microsoft Flow (now Power Automate), which the firm had already approved, so IT didn't have to sign off on a new service. Flow pulled newsletter content from a structured source, ran it through an HTML/CSS email template I wrote, and sent it to the 10,000+ employee list every week. I also refreshed one of the firm's websites and built a few smaller email automations for other manual comms.",
  stackRationale: [
    {
      tech: "Microsoft Flow",
      why: "The firm's approved automation tool, so there was nothing new for IT to approve. It gives up some flexibility for speed, which suited a weekly newsletter.",
    },
    {
      tech: "HTML + CSS (email templates)",
      why: "Email clients render HTML inconsistently (Outlook, Gmail, and mobile apps all differ). Writing the template by hand with proven patterns was more reliable than a framework that might look right in a browser and break in someone's inbox.",
    },
    {
      tech: "Visual Studio + Java",
      why: "The firm's existing tools. Small companion tools used the stack the team already had.",
    },
    {
      tech: "Excel",
      why: "The source content and distribution lists lived in Excel. Flow reads Excel directly through Microsoft Graph, so the pipeline needed no database in between.",
    },
  ],
  highlights: [
    "A Microsoft Flow pipeline delivered the weekly internal newsletter to 10,000+ employees, replacing a manual process.",
    "Authored the HTML/CSS email template that rendered newsletter content consistently across Outlook, web, and mobile clients.",
    "Shipped a refresh of one of the firm's web properties and several smaller email-automation flows for internal comms.",
  ],
};
