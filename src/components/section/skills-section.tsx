"use client";

import { Briefcase } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { HashLink } from "@/components/hash-link";
import { SectionTitle } from "@/components/section-title";
import { LIGHT_CLASS, SKILL_GROUPS, type Light, type Skill } from "@/data";
import { setProjectFilter, useProjectFilter } from "@/lib/project-filter";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

// Skills, directly above the projects, each chip the way into its proof
// (see src/data/skills.ts): a skill used in projects filters the grid
// below, one used only in a job points to Experience, and one with no
// proof on the site is a plain chip. Chips are lit in the light of the
// category they're used in most.

const LEGEND: ReadonlyArray<{ light: Light; label: string }> = [
  { light: "apps", label: "Apps" },
  { light: "ai", label: "AI/ML" },
  { light: "systems", label: "Systems" },
  { light: "games", label: "Games" },
];

const chipBase =
  "group relative border border-border border-b-2 border-b-brand/75 shadow-[0_6px_14px_-10px_var(--brand-glow)] bg-card/60 rounded-md h-8 w-fit px-3 flex items-center gap-2 text-sm font-medium text-foreground transition-all duration-200";
const chipInteractive =
  "hover:-translate-y-0.5 hover:border-brand/50 hover:border-b-brand hover:shadow-[0_6px_16px_-10px_var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SkillMark({ skill }: { skill: Skill }) {
  if (skill.icon) {
    return (
      <skill.icon className="size-4 rounded overflow-hidden object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
    );
  }
  // No logo: a short lit dash in the chip's light, like the legend.
  return (
    <span
      aria-hidden
      className="h-[2px] w-3 bg-brand shadow-[0_0_6px_0_var(--brand-glow)]"
    />
  );
}

export default function SkillsSection() {
  const filter = useProjectFilter();
  const reduceMotion = usePrefersReducedMotion();

  const pick = (skill: Skill) => {
    if (filter.skill === skill.id) {
      setProjectFilter({});
      return;
    }
    setProjectFilter({ skill: skill.id });
    document.getElementById("project-filters")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="flex min-h-0 flex-col gap-y-6">
      <BlurFade>
        <SectionTitle>Skills</SectionTitle>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Lit by where I use them most:</span>
          {LEGEND.map((l) => (
            <span key={l.light} className={cn(LIGHT_CLASS[l.light], "inline-flex items-center gap-1.5")}>
              <span className="h-[2px] w-3 bg-brand shadow-[0_0_6px_0_var(--brand-glow)]" aria-hidden />
              {l.label}
            </span>
          ))}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a skill to see the projects behind it.
        </p>
      </BlurFade>
      <div className="flex flex-col gap-5">
        {SKILL_GROUPS.map((group, gIdx) => (
          <BlurFade key={group.label} delay={gIdx * 0.06}>
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => {
                  const light = LIGHT_CLASS[skill.light];
                  if (skill.projects.length > 0) {
                    const active = filter.skill === skill.id;
                    const n = skill.projects.length;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => pick(skill)}
                        title={`${n} project${n === 1 ? "" : "s"} use ${skill.name}`}
                        className={cn(
                          light,
                          chipBase,
                          chipInteractive,
                          active && "border-brand/60 bg-brand-soft"
                        )}
                      >
                        <SkillMark skill={skill} />
                        {skill.name}
                        <span className="font-mono text-[10px] tabular-nums text-brand">
                          {n}
                        </span>
                      </button>
                    );
                  }
                  if (skill.roles.length > 0) {
                    const where = [...new Set(skill.roles.map((r) => r.company))].join(", ");
                    return (
                      <HashLink
                        key={skill.id}
                        targetId="experience"
                        title={`Used at ${where}`}
                        className={cn(light, chipBase, chipInteractive)}
                      >
                        <SkillMark skill={skill} />
                        {skill.name}
                        <Briefcase className="size-3 text-brand/80" aria-hidden />
                        <span className="sr-only">: used at {where}, see Experience</span>
                      </HashLink>
                    );
                  }
                  return (
                    <div key={skill.id} className={cn(light, chipBase, "border-b-brand/40 shadow-none")}>
                      <SkillMark skill={skill} />
                      {skill.name}
                    </div>
                  );
                })}
              </div>
            </div>
          </BlurFade>
        ))}
      </div>
    </div>
  );
}
