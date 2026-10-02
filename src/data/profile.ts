// Who you are: name, location, contact links, education, and the
// homepage bio. (Skills live in skills.ts.) The resume (/resume and the PDF) reads name,
// location, email, links, and education from here too, so a move or a
// new email is a one-line change in this file. See CONTENT.md.

import { Icons } from "@/components/icons";
import { BriefcaseIcon, FolderGit2Icon, HomeIcon } from "lucide-react";
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
  location: "Chicago, IL",
  locationLink: "https://www.google.com/maps/place/chicago+il",
  role: ROLE,
  // Hero subtitle, <meta description>, and the OG card all use this.
  description:
    "AI Engineer at Cyclotron. I've built a C++ engine that shipped a game to Steam, an ML trading research platform, and a web + mobile app I run under my own LLC.",
  summary:
    "AI Engineer at Cyclotron, a Microsoft Solutions Partner. I write C++, C#, Python, and TypeScript.\n\nI also run SquadPact under my own LLC, a scheduling app for adult soccer leagues on web, iOS, and Android. I built it because the managers on my teams spend hours each week copying schedules from league sites into group chats.\n\nStockAI is my ML trading research platform. The model retrains on new data, and a new version only goes live if it beats the current one on both direction and accuracy across market regimes.\n\nWith two teammates I wrote a C++ game engine from scratch, and we shipped a tower-offense game to Steam on it. Later I wrote a Python genetic algorithm that learned to beat the game in 16 generations. At Spur Reply, I automated a weekly newsletter that went to 10,000+ Microsoft employees.\n\nI use Claude Code to ship MVPs fast.\n\nI graduated from [DigiPen](/#education) in April 2026 with a BS in Computer Science & Game Design, and shipped games there with teams of 6 and 19.",

  // Expected at /public/avatar.jpg. If missing, AvatarFallback ("NW") renders instead.
  avatarUrl: "/avatar.jpg",

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
      location: "Redmond, WA",
      // Expected at /public/education/digipen.png. If missing, a gradient "DP" badge renders instead.
      logoUrl: "/education/digipen.png",
      start: "2021",
      end: "2026",
    },
  ],
} as const;
