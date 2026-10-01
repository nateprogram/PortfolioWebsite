// Personal profile content for the homepage: bio, contact, education,
// and the skill chip groups. The deep-dive project content lives next
// door in `projects-list.tsx` and `projects/<slug>.tsx`.

import { Icons } from "@/components/icons";
import { BriefcaseIcon, FolderGit2Icon, HomeIcon } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Python } from "@/components/ui/svgs/python";
import { Cpp } from "@/components/ui/svgs/cpp";
import { Csharp } from "@/components/ui/svgs/csharp";
import { Java } from "@/components/ui/svgs/java";
import { Unity } from "@/components/ui/svgs/unity";
import { Unreal } from "@/components/ui/svgs/unreal";
import { PyTorch } from "@/components/ui/svgs/pytorch";
import { Capacitor } from "@/components/ui/svgs/capacitor";
import { Prisma } from "@/components/ui/svgs/prisma";
import { Postgresql } from "@/components/ui/svgs/postgresql";
import { CURRENT_ROLE } from "./experience";

// Hero role line follows the current job in experience.ts, so a job
// change is a one-file edit.
const ROLE = CURRENT_ROLE
  ? `${CURRENT_ROLE.title} · ${CURRENT_ROLE.company}`
  : "Software Engineer · DigiPen '26";

export const PROFILE = {
  name: "Nate White",
  initials: "NW",
  url: "https://natewhite.dev",
  location: "Redmond, WA",
  locationLink: "https://www.google.com/maps/place/redmond+wa",
  role: ROLE,
  // Hero subtitle, <meta description>, and the OG card all use this.
  description:
    "AI Engineer at Cyclotron. I've built a C++ engine that shipped a game to Steam, an ML trading research platform, and a web + mobile app I run under my own LLC.",
  summary:
    "AI Engineer at [Cyclotron](https://www.cyclotroninc.com), a Microsoft Solutions Partner for modern work, data, and AI. C++, C#, Python, and TypeScript engineer.\n\nI also ship SquadPact under my own LLC: a scheduling app for adult soccer leagues, one codebase for web, iOS, and Android. It exists because the volunteer managers on my own teams burn hours every week copy-pasting schedules from league sites into group chats.\n\nStockAI is my ML trading research platform. The model retrains itself on fresh data, but a new checkpoint only goes live if it beats the prior one on both direction and regime-stratified accuracy. A silently failing model is worse than no model.\n\nWith two teammates I wrote a custom C++ engine from scratch, no commercial middleware anywhere in the stack, and we shipped a tower-offense title to Steam on it. I later wrote a Python genetic algorithm that played the game and beat it in 16 generations. At Spur Reply, I automated a fully manual newsletter pipeline reaching 10,000+ Microsoft employees.\n\nI use Claude Code to ship MVPs fast.\n\nBS Computer Science & Game Design from [DigiPen](/#education), graduated April 2026. Shipped with multi-disciplinary teams of 6 and 19 there.",

  // Expected at /public/avatar.jpg. If missing, AvatarFallback ("NW") renders instead.
  avatarUrl: "/avatar.jpg",

  skillGroups: [
    {
      label: "Languages",
      items: [
        { name: "C++", icon: Cpp },
        { name: "C#", icon: Csharp },
        { name: "Python", icon: Python },
        { name: "TypeScript", icon: Typescript },
        { name: "Java", icon: Java },
      ],
    },
    {
      label: "Frameworks & Engines",
      items: [
        // `arena`: game tech, drawn in the Game Grid's orange.
        { name: "Unreal Engine", icon: Unreal, arena: true },
        { name: "Unity", icon: Unity, arena: true },
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

  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/#experience", icon: BriefcaseIcon, label: "Experience" },
    { href: "/#projects", icon: FolderGit2Icon, label: "Projects" },
  ],

  contact: {
    email: "NateWhite.dev@gmail.com",
    tel: "",
    social: {
      Resume: {
        name: "Resume",
        url: "/resume",
        icon: Icons.resume,
        navbar: true,
      },
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

  education: [
    {
      school: "DigiPen Institute of Technology",
      href: "https://www.digipen.edu",
      degree: "BS Computer Science & Game Design",
      // Expected at /public/education/digipen.png. If missing, a gradient "DP" badge renders instead.
      logoUrl: "/education/digipen.png",
      start: "2021",
      end: "2026",
    },
  ],
} as const;
