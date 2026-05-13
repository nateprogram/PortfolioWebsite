// Entries for the projects grid on the homepage. Each one becomes a
// ProjectCard. The deep-dive content for a project (problem / approach /
// code snippets) lives separately in `projects/<slug>.tsx`.
//
// Conventions:
//   slug          stable url segment; matches the file name in projects/
//   active        true => still being worked on; false => historical
//   status        free-text label kept on the type for future filtering;
//                 currently NOT rendered on cards (we don't want to
//                 surface "Coursework" / "Active" labels that imply a
//                 hierarchy between academic, personal, and employed work)
//   categories    drives the filter chips (see project-filters.ts)
//   image / video first hit wins: video > image > generated initials badge

import { Icons } from "@/components/icons";
import { Youtube } from "lucide-react";

export const PROJECTS = [
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
    links: [
      {
        type: "Website",
        href: "https://squadpact.com",
        icon: <Icons.globe className="size-3" />,
      },
    ],
    image: "/projects/squadpact/logo.png",
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
      "Live ML trading research platform. 23 scrapers feed 148 engineered features into a MultiHeadLSTM that predicts 10 timeframes at once. Closed-loop feature attention, HMM regime detection, and retrain-with-rollback all stream to a live FastAPI + WebSocket dashboard.",
    description:
      "Live ML trading research platform. 23 scrapers feed 148 engineered features into a MultiHeadLSTM that predicts 10 timeframes at once. Closed-loop feature attention, HMM regime detection, and retrain-with-rollback all stream to a live FastAPI + WebSocket dashboard. ~11,500 lines of Python across 42 modules.",
    technologies: [
      "Python",
      "PyTorch",
      "LSTM",
      "hmmlearn",
      "FastAPI",
      "WebSocket",
      "scikit-learn",
      "pandas",
      "SQLite",
      "Parquet",
      "PRAW",
      "yfinance",
    ],
    links: [],
    image: "/projects/stockai/hero.png",
    video: "",
  },
  {
    title: "Mayhem Engine · Zeppelin Rush",
    slug: "mayhem-engine",
    href: "/projects/mayhem-engine",
    dates: "2023 - 2024",
    active: true,
    status: "Coursework",
    categories: ["Systems", "Games"],
    summary:
      "Custom C++ engine built from scratch by three programmers, zero commercial middleware. I own two data-driven subsystems end-to-end (particle system and stat/upgrade system) plus the engine's input abstraction and a shared RNG. Shipped to Steam as the engine's proof-of-work.",
    description:
      "A C++ engine written from scratch on a 3-programmer team, no commercial middleware anywhere in the stack: rendering, scene graph, particle system, input, asset pipeline, and audio hooks are all hand-written. My primary ownership: an emitter-based particle system (~1,260 LOC across ParticleSystem.cpp/h and 4 emitter behaviors; emitters are JSON-serialized so every parameter, SpawnRate, SprayAngle, speed range, fade mode, scale curve, frame animation, is hot-reloadable from disk without a rebuild); a component-based stat/upgrade system (Stats.cpp/h, ~710 LOC: serialized fields for health, reload, respawn, damage, speed, cost plus per-level upgrade arrays and a first-class upgrade API); the engine's input abstraction (GLFW wrapper with per-frame edge detection shared across every subsystem); and a shared random utility. On a small team, I also contributed to every other subsystem at some point. The engine shipped a tower-offense game to Steam (Zeppelin Rush) as its proof-of-work, but the interesting story is the engine layer, not the game.",
    technologies: [
      "C++",
      "Custom engine",
      "Particle systems",
      "Component architecture",
      "GLFW",
      "OpenGL",
      "rapidjson",
    ],
    links: [
      {
        type: "Steam",
        href: "https://store.steampowered.com/app/3794410/Zeppelin_Rush/",
        icon: <Icons.steam className="size-3" />,
      },
    ],
    image: "/projects/mayhem-engine/hero.jpg",
    video: "/projects/mayhem-engine/particle-demo.mp4",
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
      "A Python genetic algorithm that teaches itself to win Zeppelin Rush, a Steam tower-offense game running on Mayhem, the C++ engine my team and I built from scratch. In 16 generations it hit a score of 401, crossing the game's three-star threshold. I've hit three stars playing it myself exactly once.",
    description:
      "A Python genetic algorithm that teaches itself to win Zeppelin Rush, a Steam tower-offense game running on Mayhem, the C++ engine my team and I built from scratch. The AI drives the live game by injecting keyboard actions and reads game state back (gold, gamestate, timer) through a shared JSON file. Starting from 60 randomly-played games, it runs 16 generations of selection, single-point crossover, mutation, and elitism, with a constraint-aware repair pass that rewrites illegal action sequences into legal ones before evaluation. After a 24-hour run the best game scored 401, crossing the three-star threshold of 400.",
    technologies: [
      "Python",
      "Genetic Algorithms",
      "C++",
      "Mayhem Engine",
      "JSON IPC",
      "keyboard (lib)",
    ],
    links: [],
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
      "Third-person action combat game built over ten months on Unreal Engine 5.2 with a 19-person team. I own the pause menu (C++ and Blueprints), the combat hitstop system, and a Blueprint-callable C++ helper library used across the project.",
    description:
      "Third-person action combat game built over ten months with a 19-person multi-disciplinary team (5 engineers, 3 designers, 10 artists, 1 audio engineer). Unreal Engine 5.2, Wwise for audio, Enhanced Input, CommonUI. Jenkins for automated builds and ClickUp for bug tracking (Asana-style workflow). My share: the pause menu end-to-end (primary UI, quit/restart confirmations, settings panel, Wwise SFX, and the combat-state-machine integration), the combat hitstop freeze-frame system inside CombatActionManager, and a UBlueprintFunctionLibrary of C++ helpers used by both engineers and designers.",
    technologies: [
      "Unreal Engine 5.2",
      "C++",
      "Blueprints",
      "Wwise",
      "Enhanced Input",
      "CommonUI",
      "Jenkins",
      "ClickUp",
      "Team of 19",
    ],
    links: [
      {
        type: "Trailer",
        href: "https://www.youtube.com/watch?v=GX7iaSS8HlQ",
        icon: <Youtube className="size-3" />,
      },
    ],
    image: "/games/isshin/hero.jpg",
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
      "Local 4-player couch party game built at Saucecup Studios with a team of 6 in Unity. I owned the Reflex Rush minigame, the game-wide AudioManager, and the Bad Luck board tile.",
    description:
      "Local 4-player couch co-op in Unity 2022.3 LTS (URP). Board map, minigames, boss battles, and item-driven stat modifications across ~10K lines of C# spread over ~200 scripts. Team of 6 at Saucecup Studios. My share: the Reflex Rush minigame end-to-end (state machine, per-player scoring, difficulty ramp), the project's AudioManager (scene-persistent, priority-based channel pool), and the Bad Luck tile on the board map.",
    technologies: ["Unity 2022.3 LTS", "C#", "URP", "Local 4-player", "Team of 6"],
    links: [],
    image: "/games/treasure-party/hero.png",
    video: "",
  },
  {
    title: "Spur Group · Client Web & Reporting",
    slug: "spur-2021",
    href: "/projects/spur-2021",
    dates: "2021",
    active: false,
    status: "Shipped",
    categories: ["Full-Stack"],
    summary:
      "Software Development Intern (returning). Shipped React/TypeScript client microsites at The Spur Group, a Redmond consulting firm serving enterprise technology clients. Worked inside a .NET + Azure DevOps pipeline and owned the Power BI reporting layer feeding the firm's weekly executive dashboards.",
    description:
      "Second-summer internship at The Spur Group, a Redmond consulting firm serving enterprise technology clients. Shipped React/TypeScript single-page applications for client engagements through a .NET + Azure DevOps pipeline (feature branches, PR review, production deploy gates) and owned the Power BI reporting layer feeding weekly executive dashboards. Small dev team, consulting-scale cycles; every deliverable went directly to an external client.",
    technologies: [
      "React",
      "TypeScript",
      ".NET",
      "Power BI",
      "Azure DevOps",
      "Git",
    ],
    links: [
      {
        type: "Website",
        href: "https://thespurgroup.com/",
        icon: <Icons.globe className="size-3" />,
      },
    ],
    image: "",
    video: "",
  },
  {
    title: "Spur Group · Internal Comms Automation",
    slug: "spur-2020",
    href: "/projects/spur-2020",
    dates: "2020",
    active: false,
    status: "Shipped",
    categories: ["Full-Stack"],
    summary:
      "Software Development Intern. Built a Microsoft Flow newsletter pipeline distributing formatted internal comms to 10,000+ employees on a weekly cadence, an HTML/CSS email template library, and a marketing-site refresh for The Spur Group, a Redmond consulting firm.",
    description:
      "Internship at The Spur Group, a Redmond consulting firm serving enterprise technology clients. Built a Microsoft Flow pipeline that pulled newsletter content from a structured source, rendered it through an HTML/CSS email template, and fanned out to the firm's 10,000+ employee distribution list on a weekly cadence, replacing a fully manual copy-paste process. Also shipped a company marketing-site refresh and several smaller email-automation flows covering adjacent manual comms processes.",
    technologies: [
      "Microsoft Flow",
      "HTML",
      "CSS",
      "Java",
      "Visual Studio",
      "Excel",
    ],
    links: [
      {
        type: "Website",
        href: "https://thespurgroup.com/",
        icon: <Icons.globe className="size-3" />,
      },
    ],
    image: "",
    video: "",
  },
] as const;
