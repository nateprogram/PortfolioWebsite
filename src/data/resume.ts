// The resume, as data. Rendered two ways from this one object:
//   - /resume              HTML page (src/app/resume/page.tsx)
//   - /resume.pdf          generated at build time (src/app/resume.pdf/route.tsx)
// and flattened to plain text for the ATS keyword tool (resume-text.ts).
//
// Work history comes from experience.ts so a new job lands everywhere at
// once. Edit copy here, not in a Word doc: the PDF is rebuilt on every
// deploy, so the download can never drift from the page.
//
// Style rules (from Nate): no em dashes, concrete numbers over adjectives,
// no AI-tell vocabulary.

import { EXPERIENCE, type ExperienceEntry } from "./experience";

export type ResumeProject = {
  name: string;
  tagline: string;
  stack: string;
  dates: string;
  bullets: ReadonlyArray<string>;
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

export const RESUME: Resume = {
  name: "Nate White",
  headline: "AI Engineer | C++ / C# / Python / System Design / ML",
  location: "Chicago, IL",
  email: "NateWhite.dev@gmail.com",
  phone: "(425) 518-1209",
  links: [
    {
      label: "linkedin.com/in/nathan-white-799765218",
      href: "https://www.linkedin.com/in/nathan-white-799765218/",
    },
    { label: "github.com/nateprogram", href: "https://github.com/nateprogram" },
    { label: "natewhite.dev", href: "https://natewhite.dev" },
  ],
  updated: "Sep 2026",
  summary:
    "AI Engineer at Cyclotron, Inc. C++, C#, Python, and TypeScript engineer. Shipped a cross-platform scheduling app to web, iOS, and Android under my LLC. Created a live ML trading research platform and a custom C++ engine that shipped a game to Steam. I use Claude Code to ship MVPs fast. Shipped with multi-disciplinary teams of 6 and 19 at DigiPen.",
  skills: [
    { label: "Languages", items: "C++, C#, Python, TypeScript, Java" },
    {
      label: "Frameworks & Engines",
      items:
        "PyTorch, FastAPI, Next.js, React, Capacitor, Unreal Engine 5, Unity, OpenGL",
    },
    {
      label: "Tools, Infrastructure & Databases",
      items:
        "Git, Docker, Azure DevOps, Jenkins, Vercel, Linux, PostgreSQL, Prisma, SQLite",
    },
  ],
  education: [
    {
      degree: "BS Computer Science & Game Design",
      school: "DigiPen Institute of Technology",
      location: "Redmond, WA",
      dates: "2021 - 2026",
    },
  ],
  experience: EXPERIENCE,
  projects: [
    {
      name: "StockAI",
      tagline: "Live ML trading research platform",
      stack: "Python, PyTorch, FastAPI",
      dates: "2024 - 2026",
      slug: "stockai",
      bullets: [
        "Designed a MultiHeadLSTM that sources data on specific stocks from Yahoo Finance, news articles, and social platforms (YouTube, X, Reddit) to predict price movements.",
        "~11,500 LOC across 42 modules. Data feeds correlation analyzers and an LSTM that predicts across 10 timeframes.",
        "A retrainer scores predictions for accuracy and fine-tunes feature weights, with automatic rollback to combat degradation.",
      ],
    },
    {
      name: "Mayhem Engine",
      tagline: "Custom C++ game engine built from an empty VS project",
      stack: "C++, GLFW, rapidjson, OpenGL",
      dates: "2023 - 2024",
      slug: "mayhem-engine",
      bullets: [
        "Created a particle system (~1,260 LOC) with JSON-serialized emitters that hot-reload from disk without a C++ rebuild.",
        "Wrote the stat/upgrade system (~710 LOC) with per-level upgrade arrays, so designers retune the curve by editing JSON instead of code.",
        "Designed the engine's input abstraction over GLFW. Shipped the engine's tower-offense title (Zeppelin Rush) to Steam.",
      ],
    },
    {
      name: "Genetic AI",
      tagline: "Modular genetic algorithm that plays games to find optimal strategies",
      stack: "Python",
      dates: "2024",
      slug: "zeppelin-rush",
      bullets: [
        "Evolved a Python genetic algorithm that played Zeppelin Rush and found the optimal strategy in 16 generations.",
        "Started from 60 random playthroughs, then bred and mutated the top performers; it beat the best human score after 14 generations.",
        "Exposed balancing issues within the game to designers.",
      ],
    },
    {
      name: "Treasure Party",
      tagline: "Local 4-player couch party game",
      stack: "Unity, C#",
      dates: "2024",
      slug: "treasure-party",
      bullets: [
        "Owned several minigames, each with its own state machine built from custom C# classes.",
        "Authored the project's scene-persistent AudioManager with a priority-based channel pool.",
      ],
    },
  ],
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
