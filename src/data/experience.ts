// Work history, newest first. This is the one place a job gets added.
//
// Everything downstream reads from here:
//   - the Experience timeline on the homepage
//   - the /resume page
//   - the generated /resume.pdf (src/app/resume.pdf/route.tsx)
//   - RESUME_TEXT, which the ATS keyword tool matches against
//
// So a new role only needs one new entry at the top of EXPERIENCE; the
// site, the HTML resume, and the PDF all pick it up on the next deploy.
//
// Conventions:
//   start / end   "Mon YYYY". `end: null` renders as "Present".
//   blurb         one-line context shown on the homepage timeline only
//   bullets       resume bullets; also shown on the timeline
//   tags          short tool / credential chips
//   projectSlug   links the entry to its /projects/<slug> case study

export type ExperienceEntry = {
  company: string;
  companyUrl?: string;
  /** Rendered after the company name, e.g. "formerly The Spur Group". */
  companyNote?: string;
  title: string;
  location: string;
  start: string;
  end: string | null;
  blurb?: string;
  bullets: ReadonlyArray<string>;
  tags?: ReadonlyArray<string>;
  projectSlug?: string;
};

export const EXPERIENCE: ReadonlyArray<ExperienceEntry> = [
  {
    company: "Cyclotron, Inc.",
    companyUrl: "https://www.cyclotroninc.com",
    title: "AI Engineer",
    location: "Remote, US",
    start: "Jul 2026",
    end: null,
    blurb: "Microsoft Solutions Partner for modern work, data, and AI.",
    // Add 2-3 bullets here as the role takes shape; they flow to the
    // homepage, /resume, and the PDF automatically.
    bullets: [],
    tags: ["Azure DevOps", "Anthropic Associate Certified"],
  },
  {
    company: "Veltarium Software LLC",
    companyUrl: "https://veltarium.com",
    title: "Founder & Engineer",
    location: "Redmond, WA",
    start: "Mar 2026",
    end: null,
    blurb: "My software studio. SquadPact is the flagship product.",
    bullets: [
      "Built SquadPact, a scheduling, RSVP, chat, and payments app for adult soccer leagues, shipped to web, iOS, and Android from one TypeScript codebase (Next.js + Capacitor).",
      "Designed a 30-model Prisma schema and 114 API route handlers covering leagues, seasons, rosters, events, RSVPs, team and direct chat, payments, and a player marketplace.",
      "Per-league scrapers (GSSL, Rats) auto-populate schedules, teams, and results; a cron-driven season lifecycle moves each team through commitment, recruiting, payment, and active phases.",
      "Integrates Neon Postgres, Clerk auth, Stripe (platform fee), Firebase push, Resend email, and Vercel Blob.",
      "Also shipped Budget Buddy (web paycheck planner) and Adaptive Strength Trainer (Android AI training app).",
    ],
    projectSlug: "squadpact",
  },
  {
    company: "Spur Reply",
    companyUrl: "https://thespurgroup.com/",
    companyNote: "formerly The Spur Group",
    title: "Software Development Intern",
    location: "Redmond, WA",
    start: "Jun 2021",
    end: "Aug 2021",
    bullets: [
      "Shipped React + TypeScript client microsites through the firm's .NET + Azure DevOps pipeline.",
      "Developed Power BI dashboards across multiple projects for client-facing data.",
    ],
    projectSlug: "spur-2021",
  },
  {
    company: "Spur Reply",
    companyUrl: "https://thespurgroup.com/",
    companyNote: "formerly The Spur Group",
    title: "Software Development Intern",
    location: "Redmond, WA",
    start: "Jun 2020",
    end: "Aug 2020",
    bullets: [
      "Automated a weekly newsletter pipeline reaching 10,000+ Microsoft employees, replacing a fully manual workflow.",
      "Created an internal Employee Morale Survey tool with Microsoft Power Automate that worked directly in Microsoft Teams.",
    ],
    projectSlug: "spur-2020",
  },
];

/** The role shown in the hero. First entry with no end date. */
export const CURRENT_ROLE = EXPERIENCE.find((e) => e.end === null);

export function formatRange(entry: Pick<ExperienceEntry, "start" | "end">) {
  return `${entry.start} - ${entry.end ?? "Present"}`;
}
