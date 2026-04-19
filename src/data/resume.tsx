import { Icons } from "@/components/icons";
import { HomeIcon, GamepadIcon } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Python } from "@/components/ui/svgs/python";
import { Csharp } from "@/components/ui/svgs/csharp";
import { Java } from "@/components/ui/svgs/java";

// TODO: replace placeholder URLs (LinkedIn, GitHub repo links) once confirmed.
// TODO: add real screenshots/videos to /public/projects/* once provided.

export const DATA = {
  name: "Nate White",
  initials: "NW",
  url: "https://natewhite.dev",
  location: "Redmond, WA",
  locationLink: "https://www.google.com/maps/place/redmond+wa",
  description:
    "Software Engineer · New Grad May 2026. I build performance-critical software across games, ML, and full-stack.",
  summary:
    "BS Computer Science at [DigiPen Institute of Technology](/#education) — the first ABET-accredited program in real-time interactive simulation. My core is C++ and systems programming; I've shipped a 4-player Unity game with a team, an ML-driven stock research system, a cross-platform team-coordination app, and a genetic-algorithm project. T-shaped toward systems and performance, with deliberate breadth across AI/ML, full-stack, and games. **Looking for new-grad SWE roles starting Summer 2026.**",
  // avatarUrl left empty so the AvatarFallback ("NW" initials) renders until
  // a real headshot is provided.
  avatarUrl: "",
  skills: [
    { name: "C++", icon: undefined },
    { name: "C#", icon: Csharp },
    { name: "Python", icon: Python },
    { name: "TypeScript", icon: Typescript },
    { name: "Next.js", icon: NextjsIconDark },
    { name: "React", icon: ReactLight },
    { name: "Java", icon: Java },
    { name: "Unity", icon: undefined },
    { name: "PyTorch", icon: undefined },
    { name: "FastAPI", icon: undefined },
    { name: "Prisma", icon: undefined },
    { name: "Capacitor", icon: undefined },
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
        // TODO: confirm/replace LinkedIn URL
        url: "https://www.linkedin.com/in/nate-white",
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
      description:
        "Cross-platform team-coordination app — events, RSVP, and a built-in marketplace for clubs and friend groups. One TypeScript codebase ships to web, iOS, and Android via Next.js + Capacitor, backed by a Prisma + PostgreSQL data layer.",
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
      description:
        "ML-driven stock research system. Combines Reddit + news sentiment analysis, neural-network price forecasts (PyTorch), and HMM-based market-regime detection, surfacing signals through a live FastAPI dashboard.",
      technologies: [
        "Python",
        "PyTorch",
        "FastAPI",
        "scikit-learn",
        "pandas",
        "Reddit API",
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
      title: "Genetic Algorithm Project",
      // TODO: add real href once user provides repo / write-up location
      href: "#",
      dates: "TBD",
      active: true,
      description:
        "Evolutionary computation project — case study in progress. (Code, supporting docs, and presentation slides being assembled.)",
      technologies: ["Python", "NumPy"],
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

  // Hackathons section is hidden by leaving this empty — the section
  // component still renders but with no content. Remove the
  // <HackathonsSection /> from page.tsx if we want to drop the heading too.
  hackathons: [],
} as const;
