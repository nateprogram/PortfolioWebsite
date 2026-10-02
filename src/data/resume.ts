// The resume, as data. Rendered two ways from this one object:
//   - /resume              HTML page (src/app/resume/page.tsx)
//   - /resume.pdf          generated at build time (src/lib/resume-pdf.tsx)
// and flattened to plain text for the ATS keyword tool (resume-text.ts).
//
// What you edit where (CONTENT.md has step-by-step recipes):
//   headline, phone, summary, projects           here
//   skills                                       skills.ts (shared with the
//                                                homepage chips)
//   name, location, email, links, education      profile.ts (shared with
//                                                the homepage)
//   work history                                 experience.ts (every role
//                                                on the homepage is on the
//                                                resume, by construction)
//
// Projects point at a homepage card by `slug` and take its dates, so the
// two can't disagree. `npm run check:content` (also run before every
// build) catches broken slugs and a PDF that no longer fits one page.
//
// Style rules (from Nate): no em dashes, concrete numbers over adjectives,
// no AI-tell vocabulary.

import { EXPERIENCE, type ExperienceEntry } from "./experience";
import { PROFILE } from "./profile";
import { PROJECTS } from "./projects-list";
import { SKILL_GROUPS } from "./skills";

type ResumeProjectCopy = {
  tagline: string;
  stack: string;
  bullets: ReadonlyArray<string>;
};

/** A resume project as written below. */
export type ResumeProjectInput = ResumeProjectCopy &
  (
    | {
        /** The homepage card (projects-list.tsx) this summarizes. */
        slug: string;
        /** Defaults to the card's title. */
        name?: string;
        dates?: never;
      }
    | {
        /** A resume-only project with no card on the site. */
        slug?: never;
        name: string;
        dates: string;
      }
  );

/** A resume project with its card's name and dates filled in. */
export type ResumeProject = ResumeProjectCopy & {
  name: string;
  dates: string;
  slug?: string;
};

export type Resume = {
  name: string;
  headline: string;
  location: string;
  email: string;
  /** PDF only. Kept off the HTML page so scrapers don't collect it. */
  phone: string;
  links: ReadonlyArray<{ label: string; href: string }>;
  /** Shown as "Updated <month>" on /resume. Bump when content changes. */
  updated: string;
  summary: string;
  skills: ReadonlyArray<{ label: string; items: string }>;
  education: ReadonlyArray<{
    degree: string;
    school: string;
    location: string;
    dates: string;
  }>;
  experience: ReadonlyArray<ExperienceEntry>;
  projects: ReadonlyArray<ResumeProject>;
};

/** "https://www.linkedin.com/in/x/" -> "linkedin.com/in/x" */
const linkLabel = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function resolveProject(p: ResumeProjectInput): ResumeProject {
  if (p.slug === undefined) return p;
  // A missing card is reported by `npm run check:content`; fall back to
  // the slug here so a typo doesn't crash the dev server.
  const card = PROJECTS.find((c) => c.slug === p.slug);
  return {
    name: p.name ?? card?.title ?? p.slug,
    dates: card?.dates ?? "",
    slug: p.slug,
    tagline: p.tagline,
    stack: p.stack,
    bullets: p.bullets,
  };
}

const PROJECT_PICKS: ReadonlyArray<ResumeProjectInput> = [
  {
    slug: "stockai",
    tagline: "Live ML trading research platform",
    stack: "Python, PyTorch, FastAPI",
    bullets: [
      "Designed a multi-head LSTM that predicts stock price moves from Yahoo Finance data, news, and social posts (YouTube, X, Reddit).",
      "~11,500 lines of Python across 42 modules. Correlation analyzers feed the LSTM, which predicts 10 timeframes.",
      "A retrainer scores past predictions, adjusts feature weights, and rolls back automatically when accuracy drops.",
    ],
  },
  {
    slug: "mayhem-engine",
    name: "Mayhem Engine",
    tagline: "Custom C++ game engine built from an empty VS project",
    stack: "C++, GLFW, rapidjson, OpenGL",
    bullets: [
      "Built a particle system (~1,260 LOC) whose JSON emitter files hot-reload without a rebuild.",
      "Wrote the stat/upgrade system (~710 LOC), so designers tune each upgrade level by editing JSON.",
      "Designed the input layer over GLFW. Shipped Zeppelin Rush, a tower-offense game, to Steam on the engine.",
    ],
  },
  {
    slug: "zeppelin-rush",
    name: "Genetic AI",
    tagline: "Genetic algorithm that learns to play a game",
    stack: "Python",
    bullets: [
      "Wrote a Python genetic algorithm that played Zeppelin Rush and found a three-star strategy in 16 generations.",
      "Started from 60 random playthroughs and bred and mutated the best ones. It beat the best human score after 14 generations.",
      "Its runs showed the designers where the game was unbalanced.",
    ],
  },
  {
    slug: "treasure-party",
    tagline: "Local 4-player couch party game",
    stack: "Unity, C#",
    bullets: [
      "Owned several minigames, each with its own C# state machine.",
      "Wrote the game's AudioManager, which persists across scenes and pools channels by priority.",
    ],
  },
];

export const RESUME: Resume = {
  name: PROFILE.name,
  headline: "AI Engineer | C++ / C# / Python / System Design / ML",
  location: PROFILE.location,
  email: PROFILE.contact.email,
  phone: "(425) 518-1209",
  links: [
    PROFILE.contact.social.LinkedIn.url,
    PROFILE.contact.social.GitHub.url,
    PROFILE.url,
  ].map((href) => ({ label: linkLabel(href), href })),
  updated: "Oct 2026",
  summary:
    "AI Engineer at Cyclotron, Inc. C++, C#, Python, and TypeScript engineer. Shipped a scheduling app to web, iOS, and Android under my LLC. Built a live ML trading research platform and a C++ game engine that shipped a game to Steam. I use Claude Code to ship MVPs fast. Shipped games with teams of 6 and 19 at DigiPen.",
  // The same list as the homepage chips (skills.ts), grouped.
  skills: SKILL_GROUPS.map((g) => ({
    label: g.label,
    items: g.skills.map((s) => s.name).join(", "),
  })),
  education: PROFILE.education.map((e) => ({
    degree: e.degree,
    school: e.school,
    location: e.location,
    dates: `${e.start} - ${e.end}`,
  })),
  // Always the full work history: the homepage timeline shows a subset
  // of this same list (entries without `onHome: false`).
  experience: EXPERIENCE,
  projects: PROJECT_PICKS.map(resolveProject),
};

/** "Cyclotron, Inc." or "Spur Reply (formerly The Spur Group)". */
export function companyLabel(entry: ExperienceEntry) {
  return entry.companyNote
    ? `${entry.company} (${entry.companyNote})`
    : entry.company;
}

/** Plain-text rendering, used by the ATS keyword matcher. */
export function resumeToPlainText(r: Resume = RESUME): string {
  const lines: string[] = [
    r.name,
    r.headline,
    [r.location, r.phone, r.email].join(" | "),
    r.links.map((l) => l.label).join(" | "),
    "",
    "Summary",
    r.summary,
    "",
    "Skills",
    ...r.skills.map((s) => `${s.label}: ${s.items}`),
    "",
    "Education",
    ...r.education.map((e) =>
      [e.degree, e.school, e.location, e.dates].join(" | ")
    ),
    "",
    "Experience",
  ];
  for (const e of r.experience) {
    lines.push(
      [e.title, companyLabel(e), e.location, `${e.start} - ${e.end ?? "Present"}`].join(" | ")
    );
    if (e.tags?.length) lines.push(e.tags.join(", "));
    for (const b of e.bullets) lines.push(`- ${b}`);
    lines.push("");
  }
  lines.push("Projects");
  for (const p of r.projects) {
    lines.push([p.name, p.tagline, p.stack, p.dates].join(" | "));
    for (const b of p.bullets) lines.push(`- ${b}`);
  }
  return lines.join("\n").trim();
}
