import { Icons } from "@/components/icons";
import { HomeIcon, GamepadIcon } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Python } from "@/components/ui/svgs/python";
import { Csharp } from "@/components/ui/svgs/csharp";
import { Java } from "@/components/ui/svgs/java";

// GitHub username "nateprogram" confirmed via SquadPact's own setup docs.
// TODO: still worth a once-over — sanity-check the per-repo URLs and the
// Treasure Party / Pocket Planet / Zeppelin Rush links (Zeppelin Rush is
// not yet pushed to GitHub).
// TODO: add real screenshots/videos to /public/projects/* once provided.

export const DATA = {
  name: "Nate White",
  initials: "NW",
  url: "https://natewhite.dev",
  location: "Redmond, WA",
  locationLink: "https://www.google.com/maps/place/redmond+wa",
  role: "Software Engineer · New Grad · May 2026",
  availability: "Open to new-grad SWE roles · Summer 2026",
  description:
    "I build performance-critical software across games, ML, and full-stack. DigiPen '26 · systems-first with breadth.",
  summary:
    "BS Computer Science at [DigiPen Institute of Technology](/#education) — the first ABET-accredited program in real-time interactive simulation. My core is C++ and systems programming; I've shipped a 4-player Unity game with a team, an ML-driven stock research system, a cross-platform team-coordination app, and a genetic-algorithm project that plays a custom C++ game engine I wrote. T-shaped toward systems and performance, with deliberate breadth across AI/ML, full-stack, and games.",
  // avatarUrl left empty so the AvatarFallback ("NW" initials) renders until
  // a real headshot is provided.
  avatarUrl: "",
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
        { name: "Next.js", icon: NextjsIconDark },
        { name: "React", icon: ReactLight },
        { name: "Unity", icon: undefined },
        { name: "PyTorch", icon: undefined },
        { name: "FastAPI", icon: undefined },
      ],
    },
    {
      label: "Data & Platform",
      items: [
        { name: "Prisma", icon: undefined },
        { name: "PostgreSQL", icon: undefined },
        { name: "Capacitor", icon: undefined },
      ],
    },
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/games", icon: GamepadIcon, label: "Games" },
  ],
  contact: {
    email: "nwhit12@gmail.com",
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
        url: "mailto:nwhit12@gmail.com",
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
      degree:
        "BS Computer Science · Real-Time Interactive Simulation (ABET-accredited)",
      // TODO: add /public/digipen.png logo
      logoUrl: "",
      start: "2022",
      end: "2026",
    },
  ],

  projects: [
    {
      title: "SquadPact",
      href: "https://github.com/nateprogram/SquadPact",
      dates: "Apr 2025 - Present",
      active: true,
      status: "Active",
      categories: ["Full-Stack"],
      description:
        "Cross-platform team-coordination app — events, RSVPs, and a built-in marketplace for clubs and friend groups. A single TypeScript codebase ships to web (Next.js on Vercel), iOS, and Android by wrapping the same Next build in Capacitor, backed by a Prisma + PostgreSQL data layer (Neon in production, Docker locally). Type safety is end-to-end: Prisma generates TS types from the schema, so every API route and React component talks to the database through the same checked surface.",
      technologies: [
        "Next.js",
        "TypeScript",
        "Capacitor",
        "Prisma",
        "PostgreSQL",
        "TailwindCSS",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/nateprogram/SquadPact",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "StockAI",
      href: "https://github.com/nateprogram/StockAI_V6",
      dates: "2024 - 2026",
      active: true,
      status: "Active",
      categories: ["AI/ML"],
      description:
        "ML-driven stock research system. A PyTorch price predictor with continuous learning is fused with HMM-based market-regime detection and a multi-source sentiment pipeline (Reddit via PRAW, Google Trends, yfinance prices). Signal aggregation, correlation analysis, and a backtester all stream into a live FastAPI dashboard with log streaming. Runs in continuous, single-pass, or backtest mode and is config-driven via YAML so models, tickers, and pipelines can be swapped without code changes.",
      technologies: [
        "Python",
        "PyTorch",
        "FastAPI",
        "hmmlearn",
        "pandas",
        "PRAW (Reddit)",
        "yfinance",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/nateprogram/StockAI_V6",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "Zeppelin Rush · Genetic AI",
      // Local source lives at C:\Users\nwhit\Documents\GitHub\School\CS380AI.
      // TODO: push this repo to GitHub (or a dedicated write-up page) and
      // replace the href with the public URL.
      href: "#",
      dates: "2024",
      active: true,
      status: "Coursework",
      categories: ["AI/ML", "Systems"],
      description:
        "Genetic algorithm (Python) that learns to win a custom real-time strategy game running on my own C++ engine (Mayhem Engine). The AI drives the live game via keystroke injection and reads back game state (gold, timer, win/lose) through a shared JSON bridge. Over 16 generations of selection, single-point crossover, mutation, and elitism — plus a constraint-aware repair pass that throws out illegal action sequences — the population converges from random play to reliable wins. CS380 AI coursework at DigiPen.",
      technologies: [
        "Python",
        "Genetic Algorithms",
        "C++",
        "Custom Game Engine",
        "IPC / JSON",
      ],
      links: [],
      image: "",
      video: "",
    },
  ],

  // Games sub-collection — surfaces on /games route. Lighter than tentpole
  // case studies but visually rich. Add more entries here as needed.
  games: [
    {
      title: "Treasure Party",
      slug: "treasure-party",
      role: "Engineering team member",
      teamSize: "Multi-disciplinary DigiPen team",
      engine: "Unity (C#)",
      year: "2024",
      summary:
        "4-player party game with a board map, minigames, boss battles, and item-driven stat modifications. ~10K LOC across ~200 C# scripts. Built as a DigiPen capstone team project.",
      links: [
        {
          type: "Source",
          href: "https://github.com/nateprogram/GAM-400-TreasureParty",
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "Pocket Planet",
      slug: "pocket-planet",
      role: "Solo developer",
      teamSize: "Solo",
      engine: "Unity (C#)",
      year: "2025",
      summary:
        "Mobile idle/clicker game built around a buildings-and-followers progression loop. Manager-pattern architecture and stat-driven balancing.",
      links: [
        {
          type: "Source",
          href: "https://github.com/nateprogram/PocketPlanetRepo",
        },
      ],
      image: "",
      video: "",
    },
  ],
} as const;

export const PROJECT_FILTERS = [
  { value: "all", label: "All" },
  { value: "ai-ml", label: "AI/ML", matches: "AI/ML" },
  { value: "full-stack", label: "Full-Stack", matches: "Full-Stack" },
  { value: "systems", label: "Systems", matches: "Systems" },
] as const;
