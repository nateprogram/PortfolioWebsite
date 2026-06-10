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
  role: "Software Engineer · New Grad · April 2026",
  description:
    "Redmond, WA · Open to new-grad SWE roles. Available now.",
  summary:
    "C++, C#, Python, and TypeScript engineer. I ship SquadPact under my own LLC: a scheduling app for adult soccer leagues. It exists because the volunteer managers on my own teams burn hours every week copy-pasting schedules from league sites into group chats.\n\nStockAI is my ML trading research platform. The model retrains itself on fresh data, but a new checkpoint only goes live if it beats the prior one on both direction and regime-stratified accuracy. A silently failing model is worse than no model.\n\nWith two teammates I wrote a custom C++ engine from scratch, no commercial middleware anywhere in the stack, and we shipped a tower-offense title to Steam on it. I later wrote a Python genetic algorithm that played the game and beat it in 16 generations. At Spur Reply, I automated a fully manual newsletter pipeline reaching 10,000+ Microsoft employees.\n\nI use Claude Code to ship MVPs fast.\n\nBS Computer Science & Game Design from [DigiPen](/#education), graduated April 2026. Shipped with multi-disciplinary teams of 6 and 19 there. Open to new-grad SWE roles.",

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
      Resume: {
        name: "Resume",
        url: "/resume.pdf",
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
