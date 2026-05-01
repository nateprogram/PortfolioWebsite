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
    "I'm a C++ and systems programmer first. With two teammates, I wrote a custom C++ game engine from scratch. Every line of rendering, scene graph, particle system, input, and asset pipeline is ours; no commercial middleware. We shipped a tower-offense title on Steam as the engine's proof-of-work, and I later wrote a Python genetic algorithm that learned to beat it in 16 generations.\n\nOutside of game work, I've built a Microsoft Power Automate pipeline that replaced a fully manual newsletter going to 10,000+ recipients on a Microsoft engagement at Spur Reply, an ML trading research platform with live model serving and closed-loop feature attention, and SquadPact: a scheduling app I started after watching the volunteer managers on the adult-league soccer teams I play on lose hours every week to copy-paste admin (league site to group chat, rinse, repeat).\n\nOn AI: it's a collaborator, not a delegate. If the prompt feels like throwing work over a wall, don't send it. The good outputs come when you're actively shaping the work.\n\nCurrently a senior at [DigiPen](/#education), graduating May 2026 and open for new-grad SWE roles.",
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

  // Reserved slot for future work entries (full-time roles, etc.) if we ever
  // want a standalone "Experience" section separate from the projects grid.
  // Currently empty. Internships live as first-class entries in `projects`
  // so everything the reader sees sits on equal footing.
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
        "Production-shaped ML trading research system. 23 scrapers feed 148 engineered features into a MultiHeadLSTM that predicts 10 timeframes at once. Closed-loop feature attention, HMM regime detection, and retrain-with-rollback all stream to a live FastAPI + WebSocket dashboard.",
      description:
        "Production-shaped ML trading research system. 23 scrapers feed 148 engineered features into a MultiHeadLSTM that predicts 10 timeframes at once. Closed-loop feature attention, HMM regime detection, and retrain-with-rollback all stream to a live FastAPI + WebSocket dashboard. ~11,500 lines of Python across 42 modules.",
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
        "Software Development Intern. Built a Microsoft Flow newsletter pipeline distributing formatted internal comms to 1,000+ employees on a weekly cadence, an HTML/CSS email template library, and a marketing-site refresh for The Spur Group, a Redmond consulting firm.",
      description:
        "Internship at The Spur Group, a Redmond consulting firm serving enterprise technology clients. Built a Microsoft Flow pipeline that pulled newsletter content from a structured source, rendered it through an HTML/CSS email template, and fanned out to the firm's 1,000+ employee distribution list on a weekly cadence, replacing a fully manual copy-paste process. Also shipped a company marketing-site refresh and several smaller email-automation flows covering adjacent manual comms processes.",
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
//   approach:       key decisions made, and alternatives that were rejected.
//                   may contain `{{code:<id>}}` placeholders which the page
//                   renderer splices in as an expandable code block inline
//                   with the surrounding prose (matching the user's request
//                   to put snippets next to the text that talks about them).
//   stackRationale: each piece of tech paired with why it was chosen
//   highlights:     scope and outcome bullets
//   figures:        diagrams/screenshots that belong inline with the approach.
//                   either `{ src, alt, caption }` for an image (which the page
//                   renders click-to-zoom) or `{ diagram: <id>, alt, caption }`
//                   which swaps in a custom React diagram component.
//   codeSnippets:   real code behind expandables. each snippet gets an `id`
//                   so prose can reference it via `{{code:<id>}}`.
export const PROJECT_DETAILS: Record<
  string,
  {
    problem?: string;
    approach?: string;
    stackRationale?: ReadonlyArray<{ tech: string; why: string }>;
    highlights?: ReadonlyArray<string>;
    figures?: ReadonlyArray<
      | { src: string; alt: string; caption?: string }
      | {
          diagram: "stockai-dataflow" | "ga-scatter";
          alt: string;
          caption?: string;
        }
    >;
    codeSnippets?: ReadonlyArray<{
      id: string;
      title: string;
      description?: string;
      language: string;
      code: string;
    }>;
  }
> = {
  squadpact: {
    problem:
      "Volunteer managers of adult soccer teams in the GSSL and Rats leagues burn hours every week on unpaid admin. Game times, opponent info, and roster changes all live on the league websites, but those sites are read-only UIs meant for browsing. So each week a manager opens the league site, copies the schedule into a group chat, texts the roster to ask who's coming, chases the non-responders, and posts the final lineup. The data already exists in a canonical form; the managers are just acting as a human API between it and their team.",
    approach:
      "Treat the league sites as the source of truth and build a scraper per league (GSSL, Rats) that resolves a public team page into a structured schedule and roster. One module per league, same interface, so adding a new league is a new module rather than a rewrite:\n\n{{code:scraper-contract}}\n\nScrapers run on a cron and on manager-triggered sync, hydrating the app's domain model: a league-site event becomes an `Event` row in Postgres, an opponent becomes a `Team`, the default RSVP state propagates to every roster member. RSVP uniqueness is a database invariant, not an app-code check: a compound unique index on `(eventId, userId)` plus a composite-key upsert means a user clicking \"Going\" twice writes the same row, and flipping between \"Going\" and \"Maybe\" mutates one row instead of inserting two.\n\n{{code:rsvp-upsert}}\n\nManager-facing flows are diffs (\"here's what changed since last sync, confirm\"), so their weekly job collapses from an hour of copy-paste into a single review pass. Cross-platform delivery is a secondary concern: a single Next.js build wraps in Capacitor to ship web, iOS, and Android from one codebase, so the scraper and domain logic are written and maintained exactly once.",
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
    codeSnippets: [
      {
        id: "rsvp-upsert",
        title: "One-RSVP-per-user-per-event: composite-key upsert",
        description:
          "RSVP uniqueness is a database invariant, not something app code enforces. A compound unique index on (eventId, userId) plus Prisma's composite-key upsert means a user clicking 'Going' twice writes the same row, and flipping between 'Going' and 'Maybe' mutates one row instead of inserting two.",
        language: "typescript",
        code: `// prisma/schema.prisma
// model RSVP {
//   id        String     @id @default(cuid())
//   eventId   String
//   userId    String
//   status    RsvpStatus
//   updatedAt DateTime   @updatedAt
//   event     Event      @relation(fields: [eventId], references: [id])
//   user      User       @relation(fields: [userId], references: [id])
//   @@unique([eventId, userId])
// }

export async function setRsvp(
  eventId: string,
  userId: string,
  status: RsvpStatus,
) {
  return prisma.rSVP.upsert({
    where: { eventId_userId: { eventId, userId } }, // composite key
    create: { eventId, userId, status },
    update: { status },
  });
}`,
      },
      {
        id: "scraper-contract",
        title: "League scraper contract: one module per league, same shape",
        description:
          "GSSL and Rats publish their schedules and rosters on their own read-only websites. Each league gets its own scraper module that implements the same interface, so adding a new league is a new module, not a rewrite. The domain model (Event, Team, Roster) is shared.",
        language: "typescript",
        code: `export interface LeagueScraper {
  leagueKey: "gssl" | "rats";
  fetchSchedule(teamUrl: string): Promise<ScrapedEvent[]>;
  fetchRoster(teamUrl: string): Promise<ScrapedPlayer[]>;
}

export interface ScrapedEvent {
  leagueEventId: string;   // stable id we dedupe on
  kickoffAt: Date;
  opponentName: string;
  location: string;
}

// Manager-triggered sync: scrape, diff against what's in Postgres,
// show the manager the diff, apply on confirmation. No silent writes.
export async function syncTeam(team: Team, scraper: LeagueScraper) {
  const [events, roster] = await Promise.all([
    scraper.fetchSchedule(team.leagueUrl),
    scraper.fetchRoster(team.leagueUrl),
  ]);
  const diff = await computeDiff(team.id, events, roster);
  return { diff, apply: () => persistDiff(team.id, diff) };
}`,
      },
    ],
  },
  stockai: {
    problem:
      "Three traps kill most ML trading systems before they can say anything useful. **Leakage**, because time-series cross-validation is easy to get wrong; standard K-Fold lets tomorrow's information teach yesterday's model. **Drift**, because markets switch regime faster than weekly bars and a model trained on trending tape silently breaks once volatility flips. And the **'predict zero' attractor**, where a loss function minimized on raw returns learns that the safest bet is always 'no move'. The model looks great on paper and forecasts nothing. The goal wasn't to hit a magic accuracy number; it was to build an end-to-end research platform that makes those three failure modes hard, not easy.",
    approach:
      "**Ingest.** 23 scrapers pull from five source families (market data via yfinance and Alpha Vantage, Reddit sentiment via PRAW across r/wallstreetbets / r/stocks / r/investing, SEC filings, macro indicators, and per-ticker news) on independent refresh cadences. Each scraper writes to a 3-tier store: hot SQLite for live reads, warm Parquet for model training, cold compressed archives for long-range backtests.\n\n**Transform.** A FeatureEngine derives 148 engineered features from the raw ingest: rolling volatility cones, regime-adjusted momentum, cross-asset correlation deltas, sentiment z-scores, microstructure proxies, and lagged macro surprises. Correlation-based feature selection prunes redundant inputs per run.\n\n**Regime.** An HMM (hmmlearn) over returns and realized-vol classifies the current regime into one of a small set of states (bull-trending, bear-trending, high-vol chop, low-vol grind). The regime label is both a feature and a gate; certain heads only fire in certain regimes.\n\n**Predict.** A MultiHeadLSTM shares a single sequence encoder across 10 per-timeframe prediction heads (minutes through weeks). A closed-loop feature-attention module tracks each feature's contribution via EMA (α=0.15, output clipped to [0.5, 2.0]) and scales the next forward pass's input weights live, so a feature that stops mattering in the current regime gets quietly down-weighted instead of dominating the loss.\n\n{{code:feature-attention}}\n\n**Validate.** Training uses Lopez de Prado's **Purged K-Fold** cross-validation with embargo zones on either side of each fold, which is the only way to honestly score a time-series model. Evaluation is direction-aware (hit rate on sign) and regime-stratified. A model is only 'good' if it's good in more than one regime.\n\n{{code:purged-kfold}}\n\n**Deploy gate.** A retrain-with-rollback ladder: every new model has to beat the incumbent on out-of-fold direction accuracy AND on regime-stratified accuracy before promotion. If the live model degrades on either axis for N consecutive windows, the system rolls back to the prior checkpoint. There is no silent redeploy.\n\n{{code:rollback-gate}}\n\n**Serve.** A FastAPI backend streams predictions, feature attention weights, current regime label, and validator stats over a WebSocket to a live dashboard. The same process exposes a REST surface for batch backtests.",
    stackRationale: [
      {
        tech: "MultiHeadLSTM (shared encoder, 10 heads)",
        why: "One encoder learns the general sequence representation once; per-timeframe heads specialize. Cheaper to train than 10 separate models and gives consistent latent representations across horizons, which is what makes cross-timeframe ensembling honest.",
      },
      {
        tech: "Closed-loop feature attention (EMA α=0.15)",
        why: "Regime shifts change which inputs matter. Rather than retrain from scratch every week, the attention module watches per-feature contribution and rescales the next pass's input weights live. Bounded to [0.5, 2.0] so it can't collapse or explode.",
      },
      {
        tech: "HMM regime detection (hmmlearn)",
        why: "Direction accuracy averaged across regimes is a lie. A model can look 55% while being 70% in one regime and 40% in another. The HMM label feeds the validator so evaluation is regime-stratified, and gates a subset of heads so regime-specific signals don't leak into the wrong state.",
      },
      {
        tech: "Purged K-Fold + embargo (Lopez de Prado)",
        why: "Standard K-Fold leaks future information into training folds on overlapping-bar targets. Purging drops overlapping observations; the embargo window blocks post-test leakage. Without both, every backtest number is optimistic fiction.",
      },
      {
        tech: "3-tier storage (SQLite / Parquet / compressed archive)",
        why: "Live path reads from SQLite (low-latency, single-writer). Training reads columnar Parquet (10-100× faster scan on numeric features). Long-range backtests and audits read from compressed archives. Each tier's cost profile matches its access pattern.",
      },
      {
        tech: "Retrain-with-rollback",
        why: "A model that silently degrades in production is worse than no model. Every candidate has to beat the incumbent on two metrics before promotion, and sustained live degradation triggers automatic rollback to the prior checkpoint.",
      },
      {
        tech: "FastAPI + WebSocket dashboard",
        why: "Research platforms with no frontend stop being used. Streaming predictions, attention weights, regime label, and validator stats live over a WebSocket means diagnosing a bad hour of signals is a glance, not a notebook run.",
      },
    ],
    highlights: [
      "~11,500 lines of Python across 42 modules covering ingest, feature engineering, regime detection, modeling, validation, and live serving.",
      "23 scrapers pulling from 5 source families (market data, Reddit sentiment, SEC filings, macro indicators, per-ticker news) on independent refresh cadences.",
      "148 engineered features with correlation-based selection pruning redundant inputs per run.",
      "MultiHeadLSTM shared-encoder architecture predicts 10 timeframes simultaneously from minutes to weeks.",
      "3-phase progressive pre-training (Daily → Hourly → Minute) transfers the LSTM encoder forward between phases with fresh per-timeframe heads at each stage. Longer timeframes bootstrap representation for shorter ones.",
      "Closed-loop feature attention via EMA (α=0.15, clipped [0.5, 2.0]) rescales input weights live as regimes shift, with no full retrain required.",
      "HMM-based regime detection gates per-regime heads and drives regime-stratified evaluation so a model must be good in more than one regime to promote.",
      "Purged K-Fold cross-validation with embargo zones (Lopez de Prado) is the backbone of every reported number. It's the only time-series CV that doesn't leak.",
      "Retrain-with-rollback ladder: candidates must beat the incumbent on out-of-fold direction accuracy AND regime-stratified accuracy before promotion; sustained live degradation auto-rolls back.",
      "3-tier storage (SQLite hot / Parquet warm / compressed archive cold) matches each access pattern's cost profile.",
      "FastAPI + WebSocket dashboard streams predictions, feature attention weights, current regime label, and validator stats live.",
    ],
    figures: [
      {
        diagram: "stockai-dataflow",
        alt: "V6 data flow. 23 scrapers in 5 peer categories (price/volume, market context, social/news, institutional, economic/alt) feed a Working Data Controller. A Feature Engine derives 148 features consumed by three parallel analyzers (order flow, sentiment, smart money) plus a correlation analyzer. A signal aggregator feeds an HMM regime detector and the MultiHeadLSTM predictor with 10 heads. A 6-check prediction validator gates the FastAPI WebSocket dashboard. A database layer off to the right interacts with multiple stages (stores real-time, reads historical, stores signals, stores checkpoints). A continuous learner and Purged K-Fold backtester form the retrain and deploy gate, with an explicit amber feedback arrow back into the predictor.",
        caption:
          "V6 data flow, positional. Peers sit side-by-side (the 5 scraper categories share a level and don't cross-talk; the 3 analyzers share a level). The database layer is off to the right so its multi-layer interactions are visible. The amber arrow is the explicit feedback loop: the continuous learner writes candidates, the backtester gates promotion, and the promoted checkpoint returns to the predictor.",
      },
    ],
    codeSnippets: [
      {
        id: "feature-attention",
        title: "Closed-loop feature attention (EMA, bounded)",
        description:
          "The one live adaptation the model does without retraining. Each feature's contribution is tracked with an EMA (α=0.15), normalized against the rolling mean, and clipped to [0.5, 2.0] so a bad batch can't collapse an input to zero or let a hot input dominate the loss.",
        language: "python",
        code: `class FeatureAttention:
    def __init__(self, n_features: int, alpha: float = 0.15,
                 lo: float = 0.5, hi: float = 2.0):
        self.alpha, self.lo, self.hi = alpha, lo, hi
        self.ema  = np.ones(n_features)     # per-feature weight
        self.hist = np.ones(n_features)     # EMA of |contribution|

    def update(self, contrib: np.ndarray) -> np.ndarray:
        """
        contrib[i] = running importance score for feature i
        (e.g. |grad_i * x_i| averaged over the last batch).
        Returns the weight to scale feature i by on the next pass.
        """
        self.hist = (1 - self.alpha) * self.hist \\
                  + self.alpha * np.abs(contrib)
        mean   = self.hist.mean() + 1e-9
        target = self.hist / mean                      # >1 = important
        self.ema = np.clip(target, self.lo, self.hi)   # bound rescale
        return self.ema`,
      },
      {
        id: "purged-kfold",
        title: "Purged K-Fold with embargo (Lopez de Prado)",
        description:
          "The only time-series CV that doesn't lie. For each test fold we purge training observations whose label window overlaps the test window, then embargo a gap on the right so leakage after the test can't bleed back into training.",
        language: "python",
        code: `def purged_kfold_indices(n: int, k: int,
                         label_h: int, embargo: int):
    fold_size = n // k
    for i in range(k):
        test_start = i * fold_size
        test_end   = test_start + fold_size
        test_idx   = np.arange(test_start, test_end)

        # Purge: drop training points whose label window
        # (t .. t + label_h) overlaps the test fold.
        train_idx = np.arange(n)
        train_idx = train_idx[(train_idx + label_h < test_start)
                              | (train_idx >= test_end)]

        # Embargo: drop the first 'embargo' training points
        # immediately after the test fold to block post-test leakage.
        train_idx = train_idx[(train_idx < test_start)
                              | (train_idx >= test_end + embargo)]

        yield train_idx, test_idx`,
      },
      {
        id: "rollback-gate",
        title: "Retrain-with-rollback promotion gate",
        description:
          "A candidate only replaces the incumbent if it wins on two metrics: out-of-fold direction accuracy AND worst-regime accuracy (so a model that shines in one regime but crumbles in another can't promote). Sustained live degradation auto-rolls back.",
        language: "python",
        code: `def promote_if_better(candidate, incumbent,
                      folds, regimes) -> bool:
    c_dir = oof_direction_accuracy(candidate, folds)
    i_dir = oof_direction_accuracy(incumbent, folds)

    c_reg = regime_stratified_accuracy(candidate, folds, regimes)
    i_reg = regime_stratified_accuracy(incumbent, folds, regimes)

    # Must beat incumbent on BOTH axes before replacing.
    if c_dir > i_dir and min(c_reg.values()) > min(i_reg.values()):
        deploy(candidate)
        log.info("PROMOTE: dir %.3f -> %.3f, "
                 "worst-regime %.3f -> %.3f",
                 i_dir, c_dir,
                 min(i_reg.values()), min(c_reg.values()))
        return True
    return False


def live_rollback_check(live, window: int = 5):
    # If live direction accuracy has fallen below the prior
    # checkpoint's validation score for 'window' consecutive
    # days, roll back to the prior checkpoint.
    recent = live.recent_daily_accuracy(window)
    if all(a < live.prior_checkpoint.val_accuracy for a in recent):
        live.rollback()`,
      },
    ],
  },
  "mayhem-engine": {
    problem:
      "Building a C++ game engine from scratch and shipping a game on it is usually a 5-to-6 programmer job. We had 3. On top of that, the designers on the team didn't deliver on their scope, so the programmers picked up tuning, level flow, and encounter pacing too. The biggest risk in that setup wasn't any single subsystem; it was that anything we didn't make self-serve for the rest of the team would burn programmer cycles we couldn't afford.",
    approach:
      "**Particle system.** An emitter-component model: every visual effect in the game (explosions, muzzle flash, death puffs, pickup sparkles) is an `Emitter` component owning a pool of particles, a JSON config, and a behavior. `ParticleSystem.cpp/h` (~840 LOC) runs the update loop; four emitter behaviors (`BehaviorEmitterTest`, `BehaviorEmitterKey`, `BehaviorEmitterDeath`, `BehaviorEmitterExplosion`, ~420 LOC together) specialize when and why an emitter fires. Every tunable field lives in JSON:\n\n{{code:emitter-json}}\n\nField-by-field, here is what each option actually does:\n\n- **PatternType**: `Rotate` spawns particles around the emitter's origin at sweeping angles, so a muzzle flash fans out. A directional vector spawns along that vector, so a thruster plume goes one way.\n- **SpawnRate**: particles per second. The emitter keeps an accumulator and spawns whole particles on frames where the fractional part tips over 1.\n- **ParticleLife**: seconds each particle lives. On spawn, age starts at 0; when age hits ParticleLife, the slot returns to the pool's free list.\n- **SprayAngle**: half-angle cone (degrees) around the pattern direction. Each particle's launch vector is rotated by a uniform random value in [-SprayAngle, +SprayAngle].\n- **MinSpeed / MaxSpeed**: uniform random launch speed along the sprayed direction.\n- **ParticleMoveWithObject**: when true, particles inherit the emitter's transform each frame (good for a trail stuck to a moving zeppelin). When false, particles live in world space (good for an explosion that stays where it detonated).\n- **HiveMind**: when true, every particle in the emitter advances its animation frame in lockstep. When false, each particle animates on its own age.\n- **UniformAnimation**: when true, all particles use the same sprite sheet. When false, each particle can pick from a set for visual variety.\n- **Fade**: `Out` fades alpha from 1 to 0 over the final `FadeTime` seconds of life. `In` fades 0 to 1 over the first `FadeTime` seconds. `None` keeps alpha at 1 the whole time.\n- **ScaleSetting**: `In` scales linearly from 1 up to `ScaleMultiplier` over `ScaleTime` seconds (growth). `Out` scales from `ScaleMultiplier` down to 1 (shrink). `Pop` scales up then back down around `ScaleTime`, which is the 'punch' curve used for impact effects.\n- **Animation**: sprite-sheet flipbook. A particle advances a frame every `FrameDuration` seconds and wraps if looping (else clamps on the last frame).\n\n**How the emitter manages particles.** Each emitter owns a fixed-size particle pool sized at load from `SpawnRate * ParticleLife` so no allocations happen at play time. Per frame the emitter does four things: (1) the spawn accumulator increments by `SpawnRate * dt` and each time it tips over 1 a free slot is pulled from the pool and filled with initial state (position, velocity sampled from spray + speed range, age=0, random animation offset); (2) one pass over the live particles advances age, integrates position by velocity * dt, evaluates the fade and scale curves against the particle's age, and advances the flipbook; (3) any particle whose age exceeds ParticleLife returns to the free list; (4) the render pass batches live particles by sprite source into a single draw call. `BehaviorEmitterKey` is the iteration hook: hold a bound key in-engine and the emitter spawns one particle per frame against the current JSON config, so the loop is 'edit JSON, reload, hold key, watch the difference' with no C++ rebuild.\n\n{{code:particle-update}}\n\n**Stat system.** `Stats.cpp` (587) + `Stats.h` (123): a Component subclass instantiated on every stat-bearing entity (towers, zeppelins, cannons). Serialized fields cover the tower-offense design space: MaxHealth, ReloadTime, RespawnRate, AttackDamage, MaxSpeed, Cost. Runtime state tracks live Health, reload/respawn timers, and IsHurt / IsAttacking / IsDead flags. Upgrade progression is first-class: per-level arrays (`MaxHealthLvls`, `MaxSpeedLvls`, `AttackDamageLvls`, `UpgradeCostLvls`) indexed by the entity's current upgrade level. When the UI calls `UpgradeMaxHealth()`, the method bounds-checks against the level cap, charges the player `UpgradeCostLvls[level]`, advances the level, and reads the new MaxHealth out of `MaxHealthLvls[level]`. Designers retune the upgrade curve by editing JSON, no rebuild.\n\n{{code:stats-h}}\n\n**Input abstraction.** `MEInput.cpp/h` (~241 LOC) wraps GLFW with per-frame edge detection. `PollEvents()` at the top of every frame snapshots current key/mouse state into one array and last frame's state into another; `IsKeyPressed(key)` returns true only on the frame the key transitioned from up to down (current=down, previous=up); `IsKeyHeld` checks current=down; `IsKeyReleased` is the down-to-up transition. Every system in the engine polls through this single abstraction, so menus, gameplay, and debug keybinds all share the same per-frame semantics without pulling GLFW into gameplay code.\n\n{{code:meinput}}\n\n**Cross-subsystem contributions.** With a 3-programmer team, nobody stayed in their lane. I touched rendering, asset loading, gameplay code (`TowerBehavior`, `CannonBehavior`, `BehaviorHealthBar`), and UI wiring alongside the two programmers who were primary owners. When the designers' scope fell through, the programmers absorbed tuning and level flow too.",
    stackRationale: [
      {
        tech: "C++ with no commercial middleware",
        why: "The goal was to understand the engine layer end-to-end. Every rendering call, every memory pool, every hot path is ours. No black boxes blaming a crash on a vendor.",
      },
      {
        tech: "JSON-serialized emitters (rapidjson)",
        why: "Particles are a system designers touch constantly. Moving every emitter parameter into a data file meant iteration happened in a text editor, not in C++. Hot-reload + GLFW_KEY_P live-spawn closed the loop without building a custom editor.",
      },
      {
        tech: "Component-based entity model (Stats : public Component)",
        why: "Every entity that had stats got the same component. Serialization, update logic, and upgrade flow live in one place; towers, zeppelins, and cannons just tag themselves by `ObjectType` and inherit the rest.",
      },
      {
        tech: "Per-level upgrade arrays",
        why: "Tower upgrades are the core progression loop. Storing each stat's level values as an indexed array (rather than hard-coded per-level multipliers) let designers retune the upgrade curve by editing JSON. The `Upgrade*` methods bounds-check the level cap, charge the cost from `UpgradeCostLvls[level]`, advance the level, and read the new stat value out of the matching level array. No balancing change required a rebuild.",
      },
      {
        tech: "Edge-detected input (MEInput)",
        why: "Shipping input logic needs the distinction between \"just pressed this frame\" and \"held since last frame.\" One polling abstraction gives every caller the same per-frame semantics and keeps GLFW details out of gameplay code.",
      },
    ],
    highlights: [
      "~3,000 LOC authored across 14+ engine source files.",
      "Particle system: ~1,260 LOC (ParticleSystem.cpp/h plus four emitter behaviors). Stat/upgrade system: ~710 LOC. Input abstraction: ~241 LOC.",
      "Hand-rolled stack covers 6 subsystems: rendering, scene graph, particles, input, asset pipeline, audio hooks.",
      "rapidjson pipeline: every emitter parameter and every upgrade curve lives in text files and hot-reloads without a rebuild.",
      "Shipped Zeppelin Rush to Steam running entirely on the custom stack.",
    ],
    codeSnippets: [
      {
        id: "emitter-json",
        title: "Emitter.json: full data-driven emitter schema",
        description:
          "What every effect in the game is: a JSON file. The particle system reads this via rapidjson and rebuilds the emitter's runtime parameters on each reload, so changing a fade curve is a text-editor save and a key hold, not a rebuild.",
        language: "json",
        code: `{
  "Emitter": {
    "ParticleMoveWithObject": false,
    "PatternType": "Rotate",
    "SpawnRate": 100,
    "ParticleLife": 3,
    "SprayAngle": 20,
    "MinSpeed": 100,
    "MaxSpeed": 150,
    "HiveMind": false,
    "UniformAnimation": true,
    "Fade": "Out",
    "FadeTime": 0.2,
    "ScaleSetting": "Pop",
    "ScaleMultiplier": 4.0,
    "ScaleTime": 2.9
  },
  "Animation": {
    "FrameCount": 32,
    "FrameDuration": 0.01,
    "IsLooping": true,
    "DiffAnimations": false
  },
  "Sprite": { "SpriteSource": "particlemagic" }
}`,
      },
      {
        id: "particle-update",
        title: "ParticleSystem::Update: the per-frame emitter loop",
        description:
          "What each emitter does every frame: accumulator-driven spawn, aging, motion integration, curve evaluation, flipbook advance, recycle. No allocations at play time; the pool is sized at load from SpawnRate * ParticleLife.",
        language: "cpp",
        code: `void ParticleSystem::Update(float dt)
{
  // 1. Spawn. Accumulator spawns whole particles on frames
  //    where the fractional part tips over 1.
  spawnAcc_ += config_.SpawnRate * dt;
  while (spawnAcc_ >= 1.0f && !pool_.Full())
  {
    Particle* p = pool_.Acquire();
    p->pos       = ResolveSpawnPos(config_);
    p->vel       = SampleLaunchVector(config_);   // spray + speed
    p->age       = 0.0f;
    p->animFrame = config_.HiveMind ? hiveFrame_ : 0;
    spawnAcc_   -= 1.0f;
  }

  // 2. Update every live particle in one pass.
  for (Particle& p : pool_.Alive())
  {
    p.age += dt;
    if (p.age >= config_.ParticleLife) { pool_.Release(p); continue; }

    p.pos  += p.vel * dt;
    p.alpha = EvalFade(config_.Fade, p.age,
                       config_.ParticleLife, config_.FadeTime);
    p.scale = EvalScale(config_.ScaleSetting, p.age,
                        config_.ScaleMultiplier, config_.ScaleTime);

    AdvanceFlipbook(p, anim_, dt);
  }

  if (config_.HiveMind) AdvanceFlipbook(hiveFrame_, anim_, dt);
}`,
      },
      {
        id: "stats-h",
        title: "Stats.h: component interface for any stat-bearing entity",
        description:
          "Every entity with health or damage gets one of these. Serialized fields cover the tower-offense design space, per-level arrays drive the upgrade curve, and the Upgrade* methods bounds-check the cap, charge the cost, and advance the level.",
        language: "cpp",
        code: `class Stats : public Component
{
public:
  // Serialized design fields (read from JSON).
  int   MaxHealth, ReloadTime, RespawnRate, AttackDamage;
  float MaxSpeed;
  int   Cost;

  // Per-level upgrade curves. [0] is the base stat, [1] first
  // upgrade, [2] second. Designers edit these arrays in JSON.
  std::vector<int>   MaxHealthLvls;
  std::vector<float> MaxSpeedLvls;
  std::vector<int>   AttackDamageLvls;
  std::vector<int>   UpgradeCostLvls;

  // Runtime state.
  int   Health;
  float reloadTimer_, respawnTimer_;
  bool  IsHurt, IsAttacking, IsDead;

  // Upgrade API. Each method bounds-checks against the level cap,
  // charges UpgradeCostLvls[level], advances the level, and reads
  // the new value out of the matching level array. Returns false
  // if already at cap or player can't afford.
  bool UpgradeMaxHealth();
  bool UpgradeMaxSpeed();
  bool UpgradeAttackDamage();

  // Called on JSON (re)load to rebuild the serialized fields.
  void Deserialize(const rapidjson::Value& v) override;
};`,
      },
      {
        id: "meinput",
        title: "MEInput: edge-detected input over GLFW",
        description:
          "One polling abstraction for the whole engine. PollEvents snapshots the current-frame state; the query methods diff against the previous frame so every caller gets the same 'just pressed this frame' semantics without pulling in GLFW directly.",
        language: "cpp",
        code: `class MEInput
{
public:
  // Call once at the top of every frame.
  static void PollEvents();

  // Edge-detected queries: true only on the frame the key
  // transitioned. No repeat, no autorepeat, no timing surprises.
  static bool IsKeyPressed(int key);    // up -> down this frame
  static bool IsKeyHeld(int key);       // currently down
  static bool IsKeyReleased(int key);   // down -> up this frame

  static bool IsMousePressed(int btn);
  static bool IsMouseHeld(int btn);
  static bool IsMouseReleased(int btn);

  static glm::vec2 MousePos();

private:
  static std::array<bool, MAX_KEYS>  curr_, prev_;
  static std::array<bool, MOUSE_BTNS> currMouse_, prevMouse_;
};`,
      },
    ],
  },
  "zeppelin-rush": {
    problem:
      "Genetic algorithms fail or succeed on one thing: fitness. Zeppelin Rush's built-in score is 0/1/2/3 stars, and those bands are too coarse to drive evolution. Two losing games both sit at zero, so selection has nothing to pick between them. No gradient, no climb. Before a single mutation could happen, the fitness function had to tell 'lost in 20 seconds' apart from 'nearly won', and 'just barely won' apart from 'three-star finish'.",
    approach:
      "**Fitness.** Use time remaining on win (0 to 600, higher is better) instead of the 0/1/2/3 star bands. Losses map to a large negative. Every individual now gets a distinct score, and the gradient runs continuously from 'lost slowly' through 'barely won' to 'three-star finish'. Selection always has something to pick.\n\n{{code:fitness}}\n\n**I/O.** The game was mouse-driven. I remapped its inputs onto keyboard keys (T, R, S/M/L, H/A/Q, Z/X/C) and drove it from Python via the `keyboard` library. Keystrokes are faster and more reliable than screen-grabbing coordinates. Data comes back through `SharedData.json`: the engine writes gold/gamestate/timer continuously, the Python side polls. Shared memory would have meant rewriting too much of the engine's gameplay code. Windows file-locking turned the OS lock into a free sync primitive: if a read landed mid-write, the `IOError` was caught, the Python code slept a millisecond, and retried.\n\n{{code:sharedata-read}}\n\n**Repair pass.** Mutation and crossover regularly produce illegal sequences (selecting the same zeppelin twice in a row, upgrading past the two-upgrade cap). Rather than penalize them in fitness and hope they evolve out, `FixMutation` walks the action list and rewrites each illegal move into a random spawn. Every evaluated individual is actually playable, and the GA stops wasting generations on no-ops.\n\n{{code:fixmutation}}\n\n**Outer loop.** 60 randomly-played starting games, then 16 evolution steps. Each step selects the top 4 by fitness, runs single-point crossover on the top pair, applies 8-action-flip mutations to the best individuals, plays every new individual in-game, and carries the top 4 through unchanged via elitism. A good run is never lost to a bad mutation.\n\n{{code:crossover-mutation}}",
    stackRationale: [
      {
        tech: "Python + `keyboard` library",
        why: "Injecting keystrokes was simpler and more reliable than screen-grabbing and mouse simulation. The engine got a one-time keyboard-input remap and after that the GA had no dependency on engine internals.",
      },
      {
        tech: "SharedData.json + Windows file locking",
        why: "Shared memory would have forced a large engine-side refactor. JSON plus a `try/except IOError` turned the OS file lock into a free sync primitive and kept gameplay code untouched.",
      },
      {
        tech: "FixMutation (constraint-aware repair)",
        why: "Mutation and crossover regularly produce illegal sequences (double-select, over-upgrade). Rather than penalizing them in fitness and hoping they evolve out, the repair pass rewrites them into legal moves so every evaluated individual is actually playable.",
      },
      {
        tech: "Elitism (top 4 carried unchanged)",
        why: "Locks in the current best score against the risk that every offspring of a good run mutates into something worse. The best-fitness trend line can never go down.",
      },
      {
        tech: "Mayhem Engine (C++, built with my team)",
        why: "Having the source of the game it's solving meant I could add the keyboard remap and the JSON output from the game side without guessing at APIs or fighting an opaque runtime.",
      },
    ],
    highlights: [
      "Best game: 401, crossing the three-star threshold of 400. I've done that playing the game myself exactly once.",
      "60 random starts, 16 generations, ~24 hours of wall-clock compute to converge.",
      "Continuous time-remaining fitness (0 to 600) instead of 0/1/2/3 star bands. That one design choice is what made evolution work at all.",
      "FixMutation repair keeps every evaluated individual playable. Illegal moves get rewritten to legal ones before fitness runs.",
      "JSON IPC with Windows file-lock retry. No engine gameplay refactor required.",
      "Per-generation JSON output: any specific game can be replayed in-engine, and the scatter plot rebuilt straight from the files.",
      "Built before AI coding assistants were mature enough to help. Fitness design, IPC pivot, and the repair pass were all worked out by hand.",
    ],
    figures: [
      {
        diagram: "ga-scatter",
        alt: "Interactive scatter plot of every game the genetic AI played. X axis: generation (0 to 16). Y axis: score in seconds remaining (−99 sentinel = loss). Hover any dot to see the exact score. A cyan trend line connects the best winning score of each generation, rising from 306 at gen 0 through the 400-point three-star threshold and topping out at 401.85 by gen 15.",
        caption:
          "Fitness by generation. Each dot is one game; hover for the exact score. Cyan line is the best win of each generation. The amber line at 400 is the three-star rating threshold. The GA didn't just improve, it converged to the game's near-theoretical ceiling.",
      },
      {
        src: "/projects/zeppelin-rush/data-layout.png",
        alt: "Three-panel view of the on-disk outputs. Left: Best_Game.json showing the winning action sequence and the final score of 401.84. Middle: the Games folder containing GameEvolution_1.json through GameEvolution_16.json plus OrigionalGames. Right: OrigionalGames.json mapping each of the 60 starting games to its finishing time.",
        caption:
          "The three on-disk outputs. Left: the winning action sequence, ending at 401.84. Middle: a JSON per generation, each holding the full action list for every game so any run can be replayed in the engine. Right: the times-only counterpart. The Games(TimesOnly) folder writes one of these per generation with just the finishing times, for quick analysis without loading full action lists.",
      },
    ],
    codeSnippets: [
      {
        id: "fitness",
        title: "Fitness: time remaining on win, negative on loss",
        description:
          "The single design choice that made evolution possible. 0/1/2/3 stars is too coarse (two losing games both sit at zero, so selection has nothing to pick). Continuous time-remaining gives every individual a distinct score and a gradient that runs from 'lost slowly' through 'barely won' to 'three-star finish'.",
        language: "python",
        code: `def fitness(game_result: dict) -> float:
    """
    game_result is parsed from SharedData.json after the game ends.
    Winning is rewarded by how much time was left (0..600 seconds).
    Losing is a large negative so the GA always prefers any win over
    any loss, but still gradients between 'lost fast' and 'lost slow'.
    """
    timer = game_result["Timer"]       # seconds left when game ended
    state = game_result["Gamestate"]   # "Win" or "Lose"
    if state == "Win":
        return timer                   # higher = finished faster
    return -600.0 + timer              # still a gradient between losses`,
      },
      {
        id: "fixmutation",
        title: "FixMutation: constraint-aware repair of illegal sequences",
        description:
          "Mutation and crossover regularly produce sequences that violate the game's rules (selecting the same zeppelin twice in a row, upgrading a stat past the two-upgrade cap). Rather than penalize them in fitness and wait for them to evolve out, the repair pass rewrites each illegal move into a random legal spawn. Every evaluated individual is actually playable.",
        language: "python",
        code: `SELECT  = {"S", "M", "L"}
UPGRADE = {"H": "health", "A": "attack", "Q": "speed"}
SPAWNS  = ["Z", "X", "C"]   # top / middle / bottom lane

def FixMutation(actions):
    fixed = []
    selected = "S"                                   # small by default
    upgrades = {z: {"health": 0, "attack": 0, "speed": 0}
                for z in SELECT}

    for a in actions:
        if a in SELECT:
            # Illegal: two selects in a row. The previous select was
            # pointless, so replace THIS one with a random spawn.
            if fixed and fixed[-1] in SELECT:
                fixed.append(random.choice(SPAWNS)); continue
            selected = a
            fixed.append(a)
        elif a in UPGRADE:
            stat = UPGRADE[a]
            # Illegal: upgrading past the 2-upgrade cap.
            if upgrades[selected][stat] >= 2:
                fixed.append(random.choice(SPAWNS)); continue
            upgrades[selected][stat] += 1
            fixed.append(a)
        else:
            fixed.append(a)
    return fixed`,
      },
      {
        id: "crossover-mutation",
        title: "Crossover + mutation on action lists",
        description:
          "Each genome is just the action list the AI fed into the game. Single-point crossover splices two parents at a random index. Mutation flips 8 positions uniformly. Illegal tails from either op are repaired by FixMutation before evaluation.",
        language: "python",
        code: `ACTIONS = ["M", "L", "H", "A", "Q", "Z", "X", "C"]

def crossover(p1, p2):
    idx = random.randrange(1, min(len(p1), len(p2)))
    child1 = p1[:idx] + p2[idx:]
    child2 = p2[:idx] + p1[idx:]
    return FixMutation(child1), FixMutation(child2)

def mutate(genome, flips: int = 8):
    g = list(genome)
    for _ in range(flips):
        i = random.randrange(len(g))
        g[i] = random.choice(ACTIONS)
    return FixMutation(g)`,
      },
      {
        id: "sharedata-read",
        title: "SharedData.json read loop with Windows file-lock retry",
        description:
          "The engine writes gamestate/gold/timer to SharedData.json every frame. The Python side polls. If a read lands mid-write, Windows file-locking raises IOError, the catch block waits a millisecond, and retries. Shared memory would have required a significant engine-side refactor; this got IPC working in an afternoon.",
        language: "python",
        code: `def read_game_state(path="SharedData.json", max_retries=50):
    for _ in range(max_retries):
        try:
            with open(path, "r") as f:
                return json.load(f)["GameInfo"]
        except (IOError, json.JSONDecodeError):
            # Engine is mid-write. Back off one tick and retry.
            time.sleep(0.001)
    raise RuntimeError("SharedData.json never settled")`,
      },
    ],
  },
  isshin: {
    problem:
      "Ten-month production in Unreal Engine 5 with a 19-person team building a third-person action combat game. The engineering scope was the kind that sounds trivial until you ship it: a pause menu that suspends a live combat state machine cleanly, freeze-frame hits that feel punchy without desyncing the animation graph, and a helper library that both engineers and designers want to call from anywhere without each team reinventing it.",
    approach:
      "**Pause menu.** Owned end-to-end across C++ and Blueprints. Primary pause UI (`GameUI_BP_Pause`), quit-confirm overlay, restart-confirm overlay, settings panel, and the control-panel screens. Wwise integration for pause SFX (hit, button hover, button press). Ties into `CombatActionManager` via an `FTimerHandle activePause` handle, so the combat state machine cleanly suspends action ticks while paused and resumes on the same frame it left.\n\n{{code:pause-handoff}}\n\n**Hitstop.** Frame-counted freeze-on-hit inside `CombatActionManager`. A `bool hitstop_active` flag and an `int hitstop_frame_counter` drive the freeze: on a confirmed hit, `SetHitstop(true)` flips the flag; the manager's tick skips action updates while the counter increments; at the per-action `Hitstop_frames` ceiling, it auto-releases. Per-attack frame counts live on the `FCombatAction` struct so designers can tune feel per move without touching code. Counting animation frames rather than wall-clock seconds keeps freeze duration deterministic across frame-rate spikes.\n\n{{code:hitstop}}\n\n**UHelperFunctions (Blueprint library).** A `UBlueprintFunctionLibrary` exposing four heavily-used utilities via `BlueprintCallable`: `FindRotationDegrees` (rotation targeting for combat positioning), `CalculateFrenzyDamage` (frenzy-scaled damage with level-based stat curves), `GetPlayerCharacter` (safe player access from anywhere), and `GetPositionFromRelative` (relative-space positioning). One implementation, called from both C++ combat code and Blueprint event graphs.\n\n{{code:uhelperfunctions}}\n\n**Cross-team plumbing.** Touched many other Blueprints and systems across the full production. Beyond code: Jenkins for automated builds (so designers and artists always had a recent runnable build without waiting on a programmer), and ClickUp for bug tracking, which is the same shape as Asana (what most studios use).",
    stackRationale: [
      {
        tech: "Unreal Engine 5.2",
        why: "The right tool for a 19-person team: AAA-style rendering, a mature animation graph, and a Blueprint layer that lets designers and artists iterate without waiting on a C++ rebuild.",
      },
      {
        tech: "Hitstop via frame counter (not wall-clock seconds)",
        why: "Combat feel is frame-deterministic. Counting animation frames keeps freeze duration locked across frame-rate spikes and matches how animators think about impact frames.",
      },
      {
        tech: "UBlueprintFunctionLibrary for helpers",
        why: "Designers and engineers both needed the same utilities. A Blueprint function library exposes the C++ surface to event graphs with no extra glue, so one implementation serves both worlds.",
      },
      {
        tech: "Wwise (audio middleware)",
        why: "Audio-engineer-facing workflow: event-driven sound, dynamic mixing, and a real authoring tool. Pause-menu SFX wiring becomes a one-line `AkAudioEvent` reference instead of a custom sound-manager subsystem.",
      },
      {
        tech: "Jenkins + ClickUp",
        why: "Jenkins ran automated builds so the whole team had a recent runnable build every day without asking a programmer for one. ClickUp handled bug reports and task triage in the same shape as Asana, which is what most studios use.",
      },
    ],
    highlights: [
      "Team of 19 (5 engineers, 3 designers, 10 artists, 1 audio engineer) over ten months.",
      "62 C++ files across the Runtime and Editor modules. 107+ Blueprint assets.",
      "Pause menu owned end-to-end: primary UI, quit/restart confirmations, settings panel, Wwise SFX, and clean suspension of the combat state machine via `FTimerHandle activePause`.",
      "Hitstop implemented inside `CombatActionManager` with per-action tunable frame counts on `FCombatAction`. Designers retune combat feel without touching code.",
      "`UHelperFunctions` Blueprint library with 4 widely-used utilities (rotation targeting, frenzy damage scaling, player access, relative positioning). Same surface from C++ and Blueprints.",
      "Wwise audio middleware, Enhanced Input, and CommonUI across the UI stack.",
      "Jenkins for automated builds. ClickUp for bug tracking (Asana-style workflow).",
    ],
    codeSnippets: [
      {
        id: "hitstop",
        title: "Hitstop: frame-counted freeze-on-hit in CombatActionManager",
        description:
          "Counting animation frames, not wall-clock seconds. Freeze duration stays deterministic across frame-rate spikes and matches how animators think about impact frames. Per-action ceilings live on the FCombatAction struct so designers tune feel per move without touching code.",
        language: "cpp",
        code: `// CombatActionManager.h
struct FCombatAction
{
    // ... other fields ...
    int Hitstop_frames = 3;   // per-move ceiling, designer-tunable
};

// CombatActionManager.cpp
void UCombatActionManager::TickComponent(float DeltaTime, ...)
{
    if (hitstop_active)
    {
        // Frozen: skip action ticks, count one frame, auto-release.
        ++hitstop_frame_counter;
        if (hitstop_frame_counter >= CurrentAction.Hitstop_frames)
        {
            SetHitstop(false);
            hitstop_frame_counter = 0;
        }
        return;                    // nothing else runs while frozen
    }
    AdvanceAction(DeltaTime);      // normal path
}

void UCombatActionManager::OnHitConfirmed(const FHitResult& hit)
{
    // Only flip the flag on a confirmed hit; the tick does the rest.
    SetHitstop(true);
    hitstop_frame_counter = 0;
}`,
      },
      {
        id: "pause-handoff",
        title: "Pause menu / combat state-machine handoff",
        description:
          "An FTimerHandle held by the pause subsystem is the suspend token. Pause pauses the handle, freezing combat ticks; resume unpauses and the combat manager picks up on the same frame it left. Widgets drive this via BlueprintCallable wrappers so designers wire it in Blueprint without calling into C++.",
        language: "cpp",
        code: `// GameUI_PauseSubsystem.h
UCLASS()
class UGameUI_PauseSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable) void Pause();
    UFUNCTION(BlueprintCallable) void Resume();

private:
    FTimerHandle activePause;
    TWeakObjectPtr<UCombatActionManager> Combat;
};

// GameUI_PauseSubsystem.cpp
void UGameUI_PauseSubsystem::Pause()
{
    if (Combat.IsValid())
    {
        Combat->SuspendTicks();                           // combat freezes
        GetWorld()->GetTimerManager().PauseTimer(activePause);
    }
    ShowPauseWidget();
}

void UGameUI_PauseSubsystem::Resume()
{
    HidePauseWidget();
    if (Combat.IsValid())
    {
        GetWorld()->GetTimerManager().UnPauseTimer(activePause);
        Combat->ResumeTicks();
    }
}`,
      },
      {
        id: "uhelperfunctions",
        title: "UHelperFunctions: one Blueprint library, four utilities",
        description:
          "Engineers and designers both needed the same utilities. A UBlueprintFunctionLibrary exposes the C++ surface to Blueprint event graphs with no glue, so one implementation serves both worlds. BlueprintPure where the function is side-effect-free so it can be called in-graph without an exec pin.",
        language: "cpp",
        code: `UCLASS()
class UHelperFunctions : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    // Rotation targeting: degrees from Source to Target in the XY plane.
    // Used by combat positioning and camera-relative input mapping.
    UFUNCTION(BlueprintPure, Category = "Isshin|Math")
    static float FindRotationDegrees(FVector Source, FVector Target);

    // Frenzy damage scaling: base damage scaled by the player's
    // current frenzy level using the level-stat curve.
    UFUNCTION(BlueprintPure, Category = "Isshin|Combat")
    static float CalculateFrenzyDamage(int32 BaseDamage, int32 FrenzyLevel);

    // Safe player access from any UObject context.
    UFUNCTION(BlueprintPure, Category = "Isshin|Player",
              meta = (WorldContext = "WorldContextObject"))
    static AIsshinCharacter* GetPlayerCharacter(
        const UObject* WorldContextObject);

    // Relative-space positioning: offset in Source's local frame,
    // returned in world space. Used for attach points and VFX.
    UFUNCTION(BlueprintPure, Category = "Isshin|Math")
    static FVector GetPositionFromRelative(FVector Origin, FRotator Rot,
                                           FVector LocalOffset);
};`,
      },
    ],
  },
  "spur-2021": {
    problem:
      "Spur is a Redmond consulting firm whose clients are large enterprise technology companies. Consulting work is different in shape from single-product engineering: every engagement is its own miniature product with its own stakeholders, timeline, and deploy target, and every deliverable ships to an external client. The engineering challenge is staying fast and correct while rotating across unrelated codebases week over week.",
    approach:
      "Built React + TypeScript client-facing sites and supporting internal tooling inside the firm's .NET + Azure DevOps source pipeline: feature branches, PR review, build gates, production deploys. On the reporting side, owned Power BI dashboards feeding the firm's weekly executive reviews: underlying data model, DAX measures, visuals, and dataset refresh cadence. Rotated across multiple client engagements in parallel, which meant context-switching between client codebases and style conventions week over week. As a returning intern, contributed to production code on day one rather than re-onboarding.",
    stackRationale: [
      {
        tech: "React + TypeScript",
        why: "The firm's standard stack for client-facing microsites. TypeScript made engagement handoffs cleaner by making the component API an enforced contract between whoever wrote a piece of UI and whoever inherited it.",
      },
      {
        tech: ".NET + Azure DevOps",
        why: "Where Spur's source of truth lived. PR review, build pipelines, and production deploys all ran through the same infrastructure the firm's permanent engineers used, so intern work and non-intern work went through identical gates.",
      },
      {
        tech: "Power BI",
        why: "Executive reporting surface at Spur and at most of its enterprise clients. Owning the dashboard meant owning the data model, DAX measures, and refresh cadence, not just the visuals.",
      },
    ],
    highlights: [
      "Shipped React/TypeScript client microsites to production through Azure DevOps (feature branches, PR review, deploy gates).",
      "Owned Power BI dashboards feeding the firm's weekly executive reviews: data model, DAX measures, and dataset refresh.",
      "Rotated across multiple client engagements in parallel, context-switching between client codebases and style conventions week over week.",
      "Small dev team; every deliverable shipped directly to an external client.",
    ],
  },
  "spur-2020": {
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
  },
};
