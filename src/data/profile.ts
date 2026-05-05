// Personal profile content for the homepage: bio, contact, education,
// and the skill chip groups. The deep-dive project content lives next
// door in `projects-list.tsx` and `projects/<slug>.tsx`.

import { Icons } from "@/components/icons";
import { HomeIcon } from "lucide-react";
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

export const PROFILE = {
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
} as const;
