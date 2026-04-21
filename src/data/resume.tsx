import { Icons } from "@/components/icons";
import { HomeIcon, Youtube } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Python } from "@/components/ui/svgs/python";
import { Csharp } from "@/components/ui/svgs/csharp";
import { Java } from "@/components/ui/svgs/java";
import { Unity } from "@/components/ui/svgs/unity";
import { Unreal } from "@/components/ui/svgs/unreal";
import { PyTorch } from "@/components/ui/svgs/pytorch";
import { Capacitor } from "@/components/ui/svgs/capacitor";
import { Prisma } from "@/components/ui/svgs/prisma";
import { Postgresql } from "@/components/ui/svgs/postgresql";

// GitHub username "nateprogram" is confirmed via SquadPact setup docs.
// TODO: sanity-check the per-repo URLs (Zeppelin Rush is not on GitHub yet).
// TODO: add real screenshots and videos under /public/projects/*.

export const DATA = {
  name: "Nate White",
  initials: "NW",
  url: "https://natewhite.dev",
  location: "Redmond, WA",
  locationLink: "https://www.google.com/maps/place/redmond+wa",
  role: "Software Engineer · New Grad · May 2026",
  description:
    "Redmond, WA · Open for new-grad SWE roles starting Summer 2026.",
  summary:
    "BS Computer Science at [DigiPen Institute of Technology](/#education), graduating May 2026. I'm a C++ and systems programmer first. My team and I wrote a custom C++ engine from scratch, and I later wrote a Python genetic algorithm that learns to win a real-time strategy game running on it. That game shipped on Steam. I've also built in Unreal and Unity with teams of engineers, designers, and artists. On my own, I've built an ML-driven stock research system and a cross-platform team-coordination app. I like hard problems and good teammates.",
  // Expected at /public/avatar.jpg. If missing, AvatarFallback ("NW") renders instead.
  avatarUrl: "/avatar.jpg",
  skillGroups: [
    {
      label: "Languages",
      items: [
        { name: "C++", icon: undefined },
        { name: "C#", icon: Csharp },
        { name: "Python", icon: Python },
        { name: "TypeScript", icon: Typescript },
        { name: "Java", icon: Java },
      ],
    },
    {
      label: "Frameworks & Engines",
      items: [
        { name: "Unreal Engine", icon: Unreal },
        { name: "Unity", icon: Unity },
        { name: "PyTorch", icon: PyTorch },
        { name: "Next.js", icon: NextjsIconDark },
        { name: "React", icon: ReactLight },
        { name: "Capacitor", icon: Capacitor },
      ],
    },
    {
      label: "Data",
      items: [
        { name: "Prisma", icon: Prisma },
        { name: "PostgreSQL", icon: Postgresql },
      ],
    },
  ],
  navbar: [{ href: "/", icon: HomeIcon, label: "Home" }],
  contact: {
    email: "NateWhite.dev@gmail.com",
    tel: "",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/nateprogram",
        icon: Icons.github,
        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/nathan-white-799765218/",
        icon: Icons.linkedin,
        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "mailto:NateWhite.dev@gmail.com",
        icon: Icons.email,
        navbar: true,
      },
    },
  },

  // TODO: populate any internships or part-time SWE work. Empty for now.
  work: [],

  education: [
    {
      school: "DigiPen Institute of Technology",
      href: "https://www.digipen.edu",
      degree: "BS Computer Science",
      // Expected at /public/education/digipen.png. If missing, a gradient "DP" badge renders instead.
      logoUrl: "/education/digipen.png",
      start: "2022",
      end: "2026",
    },
  ],

  projects: [
    {
      title: "SquadPact",
      slug: "squadpact",
      href: "/projects/squadpact",
      dates: "Apr 2025 - Present",
      active: true,
      status: "Active",
      categories: ["Full-Stack"],
      summary:
        "Scheduling and RSVP app for adult soccer team managers. Pulls schedule, opponent, and roster data directly from the GSSL and Rats league sites so the hours of weekly copy-paste work disappear. Shipping under Veltarium Software LLC.",
      description:
        "Scheduling and RSVP app for volunteer managers of adult soccer teams. Running a GSSL or Rats team currently means hours of unpaid weekly admin: copying game times off the league website, tracking roster changes, chasing RSVPs in a group chat. SquadPact scrapes the league sites directly, auto-fills the team's schedule and roster, and gives the whole squad one place to confirm attendance. Built as a single TypeScript codebase that ships to web (Next.js on Vercel), iOS, and Android by wrapping the same Next build in Capacitor, with a Prisma + PostgreSQL backend (Neon in production, Docker locally). Shipping under Veltarium Software LLC. Walkthrough available on request.",
      technologies: [
        "Next.js",
        "TypeScript",
        "Capacitor",
        "Prisma",
        "PostgreSQL",
        "TailwindCSS",
      ],
      links: [],
      image: "/projects/squadpact/hero.png",
      video: "",
    },
    {
      title: "StockAI",
      slug: "stockai",
      href: "/projects/stockai",
      dates: "2024 - 2026",
      active: true,
      status: "Active",
      categories: ["AI/ML"],
      summary:
        "ML-driven stock research system. PyTorch price predictor combined with HMM regime detection and a multi-source sentiment pipeline, streaming to a live FastAPI dashboard.",
      description:
        "ML-driven stock research system. A PyTorch price predictor with continuous learning is combined with HMM-based market-regime detection and a multi-source sentiment pipeline (Reddit via PRAW, Google Trends, yfinance prices). Signal aggregation, correlation analysis, and a backtester all stream into a live FastAPI dashboard with log streaming. Runs in continuous, single-pass, or backtest mode and is config-driven via YAML so models, tickers, and pipelines can be swapped without code changes. Private repo. Walkthrough available on request.",
      technologies: [
        "Python",
        "PyTorch",
        "FastAPI",
        "hmmlearn",
        "pandas",
        "PRAW (Reddit)",
        "yfinance",
      ],
      links: [],
      image: "/projects/stockai/hero.png",
      video: "",
    },
    {
      title: "Zeppelin Rush · Genetic AI",
      slug: "zeppelin-rush",
      href: "/projects/zeppelin-rush",
      dates: "2024",
      active: true,
      status: "Coursework",
      categories: ["AI/ML", "Systems"],
      summary:
        "Genetic algorithm (Python) that learns to win Zeppelin Rush on Steam, a real-time strategy game running on Mayhem Engine, a C++ engine my team and I wrote from scratch.",
      description:
        "Genetic algorithm (Python) that learns to win Zeppelin Rush, a real-time strategy game shipped on Steam that runs on Mayhem Engine, a C++ engine my team and I wrote from scratch. The AI drives the live game via keystroke injection and reads back game state (gold, timer, win/lose) through a shared JSON bridge. Over 16 generations of selection, single-point crossover, mutation, and elitism, plus a constraint-aware repair pass that throws out illegal action sequences, the population converges from random play to reliable wins. CS380 AI coursework at DigiPen.",
      technologies: [
        "Python",
        "Genetic Algorithms",
        "C++",
        "Custom Game Engine",
        "IPC / JSON",
      ],
      links: [
        {
          type: "Steam",
          href: "https://store.steampowered.com/app/3794410/Zeppelin_Rush/",
          icon: <Icons.steam className="size-3" />,
        },
      ],
      image: "/projects/zeppelin-rush/hero.png",
      video: "",
    },
    {
      title: "Isshin",
      slug: "isshin",
      href: "/projects/isshin",
      dates: "2024 - 2025",
      active: true,
      status: "Coursework",
      categories: ["Games"],
      summary:
        "Third-person action combat game built over two semesters at DigiPen with a 19-person multi-disciplinary team. Unreal Engine.",
      description:
        "Third-person action combat game developed over two semesters at DigiPen with a 19-person multi-disciplinary team (5 engineers, 3 designers, 10 artists, 1 audio engineer). Built in Unreal Engine.",
      technologies: [
        "Unreal Engine",
        "C++",
        "Blueprints",
        "Team of 19",
      ],
      links: [
        {
          type: "Trailer",
          href: "https://www.youtube.com/watch?v=GX7iaSS8HlQ",
          icon: <Youtube className="size-3" />,
        },
      ],
      image: "/games/isshin/hero.png",
      video: "",
    },
    {
      title: "Treasure Party",
      slug: "treasure-party",
      href: "/projects/treasure-party",
      dates: "2024",
      active: true,
      status: "Coursework",
      categories: ["Games"],
      summary:
        "4-player party game built as a DigiPen team project in Unity. ~10K LOC across ~200 C# scripts.",
      description:
        "4-player party game with a board map, minigames, boss battles, and item-driven stat modifications. ~10K LOC across ~200 C# scripts. Built as a DigiPen team project in Unity.",
      technologies: ["Unity", "C#", "Local multiplayer"],
      links: [],
      image: "/games/treasure-party/hero.png",
      video: "",
    },
  ],
} as const;

export const PROJECT_FILTERS = [
  { value: "all", label: "All" },
  { value: "ai-ml", label: "AI/ML", matches: "AI/ML" },
  { value: "full-stack", label: "Full-Stack", matches: "Full-Stack" },
  { value: "games", label: "Games", matches: "Games" },
  { value: "systems", label: "Systems", matches: "Systems" },
] as const;

// Extended detail content per project, rendered on /projects/[slug].
// A project needs an entry here only if we have real content to show.
// Missing entries fall back to the short description plus a "more to come" footer.
//
// Shape (loosely STAR):
//   problem:        what the project set out to solve
//   approach:       key decisions made, and alternatives that were rejected
//   stackRationale: each piece of tech paired with why it was chosen
//   highlights:     scope and outcome bullets
export const PROJECT_DETAILS: Record<
  string,
  {
    problem?: string;
    approach?: string;
    stackRationale?: ReadonlyArray<{ tech: string; why: string }>;
    highlights?: ReadonlyArray<string>;
  }
> = {
  squadpact: {
    problem:
      "Volunteer managers of adult soccer teams in the GSSL and Rats leagues burn hours every week on unpaid admin. Game times, opponent info, and roster changes all live on the league websites, but those sites are read-only UIs meant for browsing. So each week a manager opens the league site, copies the schedule into a group chat, texts the roster to ask who's coming, chases the non-responders, and posts the final lineup. The data already exists in a canonical form; the managers are just acting as a human API between it and their team.",
    approach:
      "Treat the league sites as the source of truth and build a scraper per league (GSSL, Rats) that resolves a public team page into a structured schedule and roster. Scrapers run on a cron and on manager-triggered sync, hydrating the app's domain model: a league-site event becomes an `Event` row in Postgres, an opponent becomes a `Team`, the default RSVP state propagates to every roster member. Manager-facing flows are diffs (\"here's what changed since last sync, confirm\"), so their weekly job collapses from an hour of copy-paste into a single review pass. Cross-platform delivery is a secondary concern: a single Next.js build wraps in Capacitor to ship web, iOS, and Android from one codebase, so the scraper and domain logic are written and maintained exactly once.",
    stackRationale: [
      {
        tech: "League scrapers (GSSL, Rats)",
        why: "Resolve a public team URL into a structured schedule and roster. Run on a cron plus a manager-triggered sync button. One module per league, so adding a new league is a new module rather than a rewrite.",
      },
      {
        tech: "Next.js (App Router)",
        why: "Hosts the web UI, server components, API routes, and the scraper jobs in one project. No separate backend to deploy or version.",
      },
      {
        tech: "Capacitor",
        why: "Wraps the same Next.js build for iOS and Android. Scraper, auth, and domain logic are written once and reused across web, iOS, and Android.",
      },
      {
        tech: "Prisma + PostgreSQL",
        why: "Canonical store for synced league data. Composite-key upserts (e.g. `eventId_userId`) enforce one-RSVP-per-user-per-event in the database, not in app code.",
      },
      {
        tech: "Clerk",
        why: "Same auth flow across the web app and the Capacitor wrappers; webhook-driven user sync into Prisma on first sign-in.",
      },
      {
        tech: "Neon (prod) / Docker Postgres (dev)",
        why: "Same Postgres engine in both environments (no sqlite-vs-postgres drift), with a zero-config cloud tier for production.",
      },
    ],
    highlights: [
      "Scrapes GSSL and Rats league sites to auto-fill schedules, opponents, and roster data. Managers review a diff instead of copying data by hand.",
      "19-model Prisma schema covering leagues, seasons, teams, roster memberships, events, RSVPs, chat, payments, and a player marketplace.",
      "40+ API route handlers across leagues, teams, events, RSVPs, rosters, invites, chat, marketplace, and a Clerk webhook.",
      "Composite-key upserts (`eventId_userId`) enforce one-RSVP-per-user-per-event in the database, not in app code.",
      "One TypeScript codebase ships to web (Next.js on Vercel), iOS, and Android via Capacitor.",
      "Shipping under Veltarium Software LLC. Walkthrough and live-app demo available on request.",
    ],
  },
};
