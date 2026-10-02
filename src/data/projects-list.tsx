// Entries for the projects grid on the homepage. Each one becomes a
// ProjectCard. The deep-dive content for a project (problem / approach /
// code snippets) lives separately in `projects/<slug>.tsx`.
//
// Conventions:
//   slug          stable url segment; the card links to /projects/<slug>
//                 and the deep dive (if any) is projects/<slug>.tsx
//   active        true => still being worked on; false => historical
//   status        optional free-text label kept for future filtering;
//                 currently NOT rendered on cards (we don't want to
//                 surface "Coursework" / "Active" labels that imply a
//                 hierarchy between academic, personal, and employed work)
//   categories    drives the filter chips; each must be a `matches`
//                 value in project-filters.ts (the content check enforces it)
//   image / video optional; first hit wins: video > shots > image >
//                 generated cover. Paths are under /public.
//   shots         phone screenshots, fanned out on the card (mobile apps)
//   poster        still frame for `video` (shown until it scrolls into view)
//   hideFromGrid  keep the /projects/<slug> page but leave it off the grid
//                 (the internships live on the Experience timeline instead)

import type { ReactNode } from "react";
import { Icons } from "@/components/icons";
import { Youtube } from "lucide-react";

/** A card as written below. */
type ProjectEntry = {
  title: string;
  slug: string;
  dates: string;
  active: boolean;
  status?: string;
  categories: ReadonlyArray<string>;
  summary: string;
  description: string;
  technologies: ReadonlyArray<string>;
  links: ReadonlyArray<{ type: string; href: string; icon: ReactNode }>;
  image?: string;
  video?: string;
  poster?: string;
  shots?: ReadonlyArray<string>;
  hideFromGrid?: boolean;
};

/** A card with its page link filled in. */
export type Project = ProjectEntry & { href: string };

const ENTRIES: ReadonlyArray<ProjectEntry> = [
  {
    title: "SquadPact",
    slug: "squadpact",
    dates: "Apr 2025 - Present",
    active: true,
    status: "Active",
    categories: ["Full-Stack"],
    summary:
      "Scheduling, RSVP, chat, and payments app for adult soccer teams. It pulls schedules, rosters, and results from the GSSL and Rats league sites, so managers stop copying them by hand. 30 Prisma models, 114 API handlers, and one codebase for web, iOS, and Android.",
    description:
      "Scheduling and RSVP app for volunteer managers of adult soccer teams. Running a GSSL or Rats team means hours of weekly admin: copying game times off the league website and chasing RSVPs in a group chat. SquadPact pulls from the league sites, fills in the team's schedule and roster, and gives the team one place to confirm attendance. Since launch it has added team and direct messages, push notifications with RSVP buttons, a season flow that takes each team through commitment, recruiting, and payment, and dues tracking with Venmo, Cash App, Zelle, and PayPal links. One TypeScript codebase ships to web (Next.js on Vercel) and to iOS and Android by wrapping the same build in Capacitor. The backend is Prisma and PostgreSQL (Neon in production, Docker locally). Built under Veltarium Software LLC.",
    technologies: [
      "Next.js",
      "TypeScript",
      "Capacitor",
      "Prisma",
      "PostgreSQL",
      "Clerk",
      "Stripe",
      "Firebase",
    ],
    links: [
      {
        type: "Website",
        href: "https://squadpact.com",
        icon: <Icons.globe className="size-3" />,
      },
    ],
    image: "/projects/squadpact/home.jpg",
    shots: [
      "/projects/squadpact/team.jpg",
      "/projects/squadpact/home.jpg",
      "/projects/squadpact/chat.jpg",
    ],
  },
  {
    title: "StockAI",
    slug: "stockai",
    dates: "2024 - 2026",
    active: true,
    status: "Active",
    categories: ["AI/ML"],
    summary:
      "Live ML trading research platform. 23 scrapers feed 148 features into a multi-head LSTM that predicts 10 timeframes. Feature attention, market-regime detection, and retraining with rollback all report to a live dashboard (FastAPI + WebSocket).",
    description:
      "Live ML trading research platform. 23 scrapers feed 148 features into a multi-head LSTM that predicts 10 timeframes. Feature attention, market-regime detection (HMM), and retraining with rollback all report to a live dashboard (FastAPI + WebSocket). About 11,500 lines of Python across 42 modules.",
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
  },
  {
    title: "Mayhem Engine · Zeppelin Rush",
    slug: "mayhem-engine",
    dates: "2023 - 2024",
    active: true,
    status: "Coursework",
    categories: ["Systems", "Games"],
    summary:
      "C++ game engine three of us wrote from scratch, with no commercial middleware. I built the particle system, the stat/upgrade system, the input layer, and a shared random-number utility. A tower-offense game shipped to Steam on it.",
    description:
      "A C++ engine written from scratch by three programmers, with no commercial middleware: rendering, scene graph, particles, input, asset pipeline, and audio hooks are all our own code. My parts: a particle system (~1,260 LOC in ParticleSystem.cpp/h and 4 emitter behaviors) whose emitters are JSON files, so spawn rate, spray angle, speed range, fade mode, scale curve, and frame animation all hot-reload from disk without a rebuild; a stat/upgrade system (Stats.cpp/h, ~710 LOC) with health, reload, respawn, damage, speed, and cost fields plus per-level upgrade arrays; the input layer (a GLFW wrapper with per-frame edge detection, used by every subsystem); and a shared random-number utility. On a three-person team I also worked on every other subsystem at some point. Zeppelin Rush, a tower-offense game, shipped to Steam on the engine.",
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
    poster: "/projects/mayhem-engine/hero.jpg",
  },
  {
    title: "Zeppelin Rush · Genetic AI",
    slug: "zeppelin-rush",
    dates: "2024",
    active: true,
    status: "Coursework",
    categories: ["AI/ML", "Systems"],
    summary:
      "A Python genetic algorithm that learns to win Zeppelin Rush, a tower-offense game on Steam built on Mayhem, the C++ engine my team wrote. In 16 generations it scored 401, past the game's three-star mark. I've earned three stars myself once.",
    description:
      "A Python genetic algorithm that learns to win Zeppelin Rush, a tower-offense game on Steam built on Mayhem, the C++ engine my team wrote. It plays the live game by sending keystrokes and reads the game state (gold, game state, timer) back from a shared JSON file. Starting from 60 random games, it runs 16 generations of selection, single-point crossover, mutation, and elitism. A repair pass rewrites illegal action sequences into legal ones before each game is played. After a 24-hour run the best game scored 401, just over the three-star threshold of 400.",
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
  },
  {
    title: "Budget Buddy",
    slug: "budget-buddy",
    dates: "2026",
    active: true,
    status: "Active",
    categories: ["Full-Stack"],
    summary:
      "Personal finance web app that plans every paycheck. It estimates take-home pay from gross income and splits it across your budget rules. Built under Veltarium Software LLC.",
    description:
      "A personal finance app that plans every paycheck. It estimates take-home pay from gross income (federal, state, and FICA taxes, all adjustable), then splits it across budget categories: fixed monthly amounts, percentages of take-home, yearly caps like a Roth IRA limit, and a remainder. Amounts are tracked in cents, so each plan adds up to the paycheck. Budgets sync across devices and work offline, and releases go out through a Docker build and deploy pipeline.",
    technologies: ["React 19", "TypeScript", "Vite", "Node.js", "Docker", "PWA"],
    links: [],
    image: "/projects/budget-buddy/dashboard.png",
  },
  {
    title: "Adaptive Strength Trainer",
    slug: "adaptive-strength",
    dates: "2026",
    active: true,
    status: "Active",
    categories: ["AI/ML", "Full-Stack"],
    summary:
      "Android training app whose AI planner builds five-week strength programs, then adjusts each workout to your logged performance, recovery, injuries, and equipment. Built under Veltarium Software LLC.",
    description:
      "An AI training app that writes five-week strength programs. The planner builds periodized programs around each user's goals, schedule, and equipment, then adjusts each workout to logged performance, recovery, injuries, and physical limits by swapping exercises and changing load. Missed sessions are folded back into the plan. It also tracks weight and body composition, syncs with Health Connect, and works offline. Built in React Native with Expo.",
    technologies: [
      "React Native",
      "Expo",
      "TypeScript",
      "Health Connect",
      "Offline-first",
    ],
    links: [],
    image: "/projects/adaptive-strength/today.jpg",
    shots: [
      "/projects/adaptive-strength/calendar.jpg",
      "/projects/adaptive-strength/today.jpg",
      "/projects/adaptive-strength/physique.jpg",
    ],
  },
  {
    title: "Isshin",
    slug: "isshin",
    dates: "2024 - 2025",
    active: true,
    status: "Coursework",
    categories: ["Games"],
    summary:
      "Third-person action game built over ten months in Unreal Engine 5.2 by a team of 19. I built the pause menu (C++ and Blueprints), the combat hitstop system, and a C++ helper library that Blueprints across the project call.",
    description:
      "Third-person action combat game built over ten months by a team of 19 (5 engineers, 3 designers, 10 artists, 1 audio engineer) in Unreal Engine 5.2 with Wwise, Enhanced Input, and CommonUI. Jenkins ran automated builds and ClickUp tracked bugs. My share: the pause menu (main screen, quit/restart confirmations, settings panel, Wwise sounds, and the hook into the combat state machine), the hitstop freeze-frame system in CombatActionManager, and a UBlueprintFunctionLibrary of C++ helpers used by engineers and designers.",
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
  },
  {
    title: "Treasure Party",
    slug: "treasure-party",
    dates: "2024",
    active: true,
    status: "Coursework",
    categories: ["Games"],
    summary:
      "Local 4-player couch party game built at Saucecup Studios with a team of 6 in Unity. I built several minigames, the game's AudioManager, and the Bad Luck board tile.",
    description:
      "Local 4-player couch co-op in Unity 2022.3 LTS (URP). Board map, minigames, boss battles, and item-driven stat modifications across ~10K lines of C# spread over ~200 scripts. Team of 6 at Saucecup Studios. My share: several of the game's minigames (each with its own state machine, per-player scoring, and difficulty curve), the project's AudioManager (scene-persistent, priority-based channel pool), and the Bad Luck tile on the board map.",
    technologies: ["Unity 2022.3 LTS", "C#", "URP", "Local 4-player", "Team of 6"],
    links: [],
    // No screenshot yet: drop one at /public/games/treasure-party/hero.png
    // and add `image: "/games/treasure-party/hero.png"`. Until then the
    // card renders a generated cover.
  },
  {
    title: "Spur Reply · Client Web & Reporting",
    slug: "spur-2021",
    dates: "2021",
    active: false,
    status: "Shipped",
    categories: ["Full-Stack"],
    summary:
      "Returning Software Development Intern at Spur Reply (formerly The Spur Group), a Redmond consulting firm for enterprise tech clients. Shipped React/TypeScript client microsites through the firm's .NET + Azure DevOps pipeline and owned the Power BI reports behind weekly executive dashboards.",
    description:
      "Second-summer internship at Spur Reply (formerly The Spur Group), a Redmond consulting firm for enterprise tech clients. Shipped React/TypeScript single-page apps for client projects through a .NET + Azure DevOps pipeline (feature branches, PR review, production deploy gates) and owned the Power BI reports behind weekly executive dashboards. Small dev team, short consulting cycles, and every deliverable went straight to a client.",
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
    hideFromGrid: true,
  },
  {
    title: "Spur Reply · Internal Comms Automation",
    slug: "spur-2020",
    dates: "2020",
    active: false,
    status: "Shipped",
    categories: ["Full-Stack"],
    summary:
      "Software Development Intern at Spur Reply (formerly The Spur Group), a Redmond consulting firm. Built a Microsoft Flow newsletter pipeline sending formatted internal comms to 10,000+ employees weekly, plus an HTML/CSS email template library and a marketing-site refresh.",
    description:
      "Internship at Spur Reply (formerly The Spur Group), a Redmond consulting firm for enterprise tech clients. Built a Microsoft Flow pipeline that pulled newsletter content from a structured source, rendered it through an HTML/CSS email template, and sent it to the firm's 10,000+ employee list every week, replacing a manual copy-paste process. I also refreshed the company marketing site and built smaller email automations for other manual comms.",
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
    hideFromGrid: true,
  },
];

export const PROJECTS: ReadonlyArray<Project> = ENTRIES.map((p) => ({
  ...p,
  href: `/projects/${p.slug}`,
}));
