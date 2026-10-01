// Skills: one list for the homepage and the resume, so the two can't
// drift. The resume prints them as grouped lines (resume.ts); the
// homepage shows them as chips directly above the projects, and each chip
// is the way into its proof:
//   - used in projects on the grid  -> filters the grid to those projects
//   - used only in a job            -> points to that job in Experience
//   - no proof on the site yet      -> a plain chip
// The content check lists skills with no proof.
//
// Proof is found, not hand-maintained:
//   projects  a card's `technologies` entry equals a name in `match`, or
//             starts with it followed by a space ("Unreal Engine 5.2")
//   jobs      an experience entry whose tags or bullets mention it, or
//             whose linked case study (projectSlug) lists it
//
// A chip's color is the light of the category where the skill is used
// most (see lights.ts), unless `light` sets it.
//
// To add a skill: add an entry to its group below. Give it `match` if
// the cards spell it differently, and an `icon` if there's one in
// src/components/ui/svgs/.

import type { ComponentType, SVGProps } from "react";
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
import { EXPERIENCE, type ExperienceEntry } from "./experience";
import { projectLight, type Light } from "./lights";
import { PROJECTS, type Project } from "./projects-list";

export type SkillGroupLabel =
  | "Languages"
  | "Frameworks & Engines"
  | "Tools, Infrastructure & Databases";

type SkillEntry = {
  /** URL-safe id, used in `?skill=`. */
  id: string;
  /** Shown on the chip and the resume. */
  name: string;
  group: SkillGroupLabel;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Names the cards and jobs use for it. Defaults to `name`. */
  match?: ReadonlyArray<string>;
  /** Override the chip's light. */
  light?: Light;
};

const ENTRIES: ReadonlyArray<SkillEntry> = [
  // Languages
  { id: "cpp", name: "C++", group: "Languages", icon: Cpp },
  { id: "csharp", name: "C#", group: "Languages", icon: Csharp },
  { id: "python", name: "Python", group: "Languages", icon: Python },
  { id: "typescript", name: "TypeScript", group: "Languages", icon: Typescript },
  { id: "java", name: "Java", group: "Languages", icon: Java },
  // Frameworks & Engines
  { id: "pytorch", name: "PyTorch", group: "Frameworks & Engines", icon: PyTorch },
  { id: "fastapi", name: "FastAPI", group: "Frameworks & Engines" },
  { id: "nextjs", name: "Next.js", group: "Frameworks & Engines", icon: NextjsIconDark },
  { id: "react", name: "React", group: "Frameworks & Engines", icon: ReactLight },
  { id: "capacitor", name: "Capacitor", group: "Frameworks & Engines", icon: Capacitor },
  { id: "unreal", name: "Unreal Engine 5", group: "Frameworks & Engines", icon: Unreal, match: ["Unreal Engine"] },
  { id: "unity", name: "Unity", group: "Frameworks & Engines", icon: Unity },
  { id: "opengl", name: "OpenGL", group: "Frameworks & Engines" },
  // Tools, Infrastructure & Databases
  { id: "git", name: "Git", group: "Tools, Infrastructure & Databases" },
  { id: "docker", name: "Docker", group: "Tools, Infrastructure & Databases" },
  { id: "azure-devops", name: "Azure DevOps", group: "Tools, Infrastructure & Databases" },
  { id: "jenkins", name: "Jenkins", group: "Tools, Infrastructure & Databases" },
  { id: "vercel", name: "Vercel", group: "Tools, Infrastructure & Databases" },
  { id: "linux", name: "Linux", group: "Tools, Infrastructure & Databases" },
  { id: "postgresql", name: "PostgreSQL", group: "Tools, Infrastructure & Databases", icon: Postgresql, match: ["PostgreSQL", "Postgres"] },
  { id: "prisma", name: "Prisma", group: "Tools, Infrastructure & Databases", icon: Prisma },
  { id: "sqlite", name: "SQLite", group: "Tools, Infrastructure & Databases" },
];

const GROUP_ORDER: ReadonlyArray<SkillGroupLabel> = [
  "Languages",
  "Frameworks & Engines",
  "Tools, Infrastructure & Databases",
];

// --------------------------------------------------------------- proof

const norm = (s: string) => s.trim().toLowerCase();

/** "Unreal Engine 5.2" counts as "Unreal Engine"; "JavaScript" isn't "Java". */
function techMatches(tech: string, names: ReadonlyArray<string>) {
  const t = norm(tech);
  return names.some((n) => t === norm(n) || t.startsWith(`${norm(n)} `));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A whole-word mention in prose ("C++" and "C#" included). */
function mentions(text: string, names: ReadonlyArray<string>) {
  return names.some((n) =>
    new RegExp(`(^|[^A-Za-z0-9])${escape(n)}(?![A-Za-z0-9+#])`, "i").test(text)
  );
}

export type Skill = SkillEntry & {
  /** Grid projects that use it, in grid order. */
  projects: ReadonlyArray<Project>;
  /** Jobs that use it (tags, bullets, or the job's case study). */
  roles: ReadonlyArray<ExperienceEntry>;
  /** The chip's light. */
  light: Light;
};

const GRID = PROJECTS.filter((p) => !p.hideFromGrid);

function resolve(entry: SkillEntry): Skill {
  const names = entry.match ?? [entry.name];
  const projects = GRID.filter((p) => p.technologies.some((t) => techMatches(t, names)));
  const roles = EXPERIENCE.filter((e) => {
    if ([...(e.tags ?? []), ...e.bullets].some((t) => mentions(t, names))) return true;
    const study = e.projectSlug && PROJECTS.find((p) => p.slug === e.projectSlug);
    return !!study && study.technologies.some((t) => techMatches(t, names));
  });
  // Most common light among its projects; ties go to the earlier card.
  let light: Light = entry.light ?? "apps";
  if (!entry.light && projects.length > 0) {
    const counts = new Map<Light, number>();
    for (const p of projects) {
      const l = projectLight(p);
      counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    light = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  return { ...entry, projects, roles, light };
}

export const SKILLS: ReadonlyArray<Skill> = ENTRIES.map(resolve);

export const SKILL_GROUPS = GROUP_ORDER.map((label) => ({
  label,
  skills: SKILLS.filter((s) => s.group === label),
}));

export function findSkill(id: string | null | undefined) {
  return id ? SKILLS.find((s) => s.id === id) : undefined;
}
