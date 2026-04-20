import { Icons } from "@/components/icons";
import { HomeIcon, Youtube } from "lucide-react";
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
  description:
    "I build performance-critical software across full-stack, ML, and games. DigiPen '26 · systems-first with breadth.",
  summary:
    "BS Computer Science at [DigiPen Institute of Technology](/#education). My core is C++ and systems programming; I've shipped a cross-platform team-coordination app, an ML-driven stock research system, a genetic-algorithm project that plays a custom C++ game engine I wrote, and team-shipped games in Unity and Unreal. T-shaped toward systems and performance, with deliberate breadth across full-stack, AI/ML, and games.",
  // Expected at /public/avatar.jpg. Missing? AvatarFallback ("NW") renders instead.
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
        { name: "Next.js", icon: NextjsIconDark },
        { name: "React", icon: ReactLight },
        { name: "Unity", icon: undefined },
        { name: "Unreal Engine", icon: undefined },
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
      // Expected at /public/education/digipen.png. Missing? Gradient "DP" badge.
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
        "Cross-platform team-coordination app. One TypeScript codebase ships to web, iOS, and Android via Capacitor; Prisma + PostgreSQL backend. Closed source, shipping under my LLC.",
      description:
        "Cross-platform team-coordination app — events, RSVPs, and a built-in marketplace for clubs and friend groups. A single TypeScript codebase ships to web (Next.js on Vercel), iOS, and Android by wrapping the same Next build in Capacitor, backed by a Prisma + PostgreSQL data layer (Neon in production, Docker locally). Type safety is end-to-end: Prisma generates TS types from the schema, so every API route and React component talks to the database through the same checked surface. Closed source — ships under my LLC; walkthrough available on request.",
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
        "ML-driven stock research system — PyTorch price predictor fused with HMM regime detection and a multi-source sentiment pipeline, streaming to a live FastAPI dashboard.",
      description:
        "ML-driven stock research system. A PyTorch price predictor with continuous learning is fused with HMM-based market-regime detection and a multi-source sentiment pipeline (Reddit via PRAW, Google Trends, yfinance prices). Signal aggregation, correlation analysis, and a backtester all stream into a live FastAPI dashboard with log streaming. Runs in continuous, single-pass, or backtest mode and is config-driven via YAML so models, tickers, and pipelines can be swapped without code changes. Private repo — walkthrough available on request.",
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
        "Genetic algorithm (Python) that learns to win Zeppelin Rush on Steam — a real-time strategy game running on a C++ engine I wrote from scratch.",
      description:
        "Genetic algorithm (Python) that learns to win Zeppelin Rush, a real-time strategy game shipped on Steam that runs on my own C++ engine (Mayhem Engine). The AI drives the live game via keystroke injection and reads back game state (gold, timer, win/lose) through a shared JSON bridge. Over 16 generations of selection, single-point crossover, mutation, and elitism — plus a constraint-aware repair pass that throws out illegal action sequences — the population converges from random play to reliable wins. CS380 AI coursework at DigiPen.",
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
