"use client";

import { useMemo } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { X } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import {
  DATA,
  LIGHT_CLASS,
  PROJECT_FILTERS,
  findSkill,
  projectLightClass,
  projectLightStyle,
} from "@/data";
import { setProjectFilter, useProjectFilter } from "@/lib/project-filter";
import { cn } from "@/lib/utils";

// The grid shows everything, one category (the tabs), or one skill (the
// chips in the Skills section just above). The filter lives in the URL;
// see src/lib/project-filter.ts.

const GRID_PROJECTS = DATA.projects.filter((p) => !p.hideFromGrid);

function matchesFilter(
  project: (typeof GRID_PROJECTS)[number],
  filter: (typeof PROJECT_FILTERS)[number]
) {
  if (!("matches" in filter)) return true;
  return project.categories.includes(filter.matches);
}

export default function ProjectsSection() {
  const filter = useProjectFilter();
  const skill = findSkill(filter.skill);
  const activeFilter = skill
    ? undefined
    : (PROJECT_FILTERS.find((f) => f.value === filter.focus) ?? PROJECT_FILTERS[0]);

  const visible = useMemo(() => {
    if (skill) {
      const slugs = new Set(skill.projects.map((p) => p.slug));
      return GRID_PROJECTS.filter((p) => slugs.has(p.slug));
    }
    return GRID_PROJECTS.filter((p) => matchesFilter(p, activeFilter ?? PROJECT_FILTERS[0]));
  }, [skill, activeFilter]);

  const setFilter = (value: string) => setProjectFilter({ focus: value });

  return (
    <section aria-labelledby="projects-heading">
      <div className="flex min-h-0 flex-col gap-y-8">
        <div className="flex flex-col gap-y-4 items-center justify-center">
          <div className="flex items-center w-full">
            {/* Light lines run into a lit HUD tag, like the film's
                interface dividers. */}
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border to-brand/60" />
            <div className="hud-glow z-10">
              <span className="hud hud-lit inline-flex items-center gap-2 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground [--cut:6px]">
                <span aria-hidden className="flex flex-col gap-[2px]">
            <span className="h-[2px] w-2 bg-brand" />
            <span className="h-px w-1 bg-brand/55" />
          </span>
                Projects
              </span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border to-brand/60" />
          </div>
          <div className="flex flex-col gap-y-3 items-center justify-center">
            <h2
              id="projects-heading"
              className="text-3xl font-bold tracking-tighter sm:text-4xl"
            >
              Selected work
            </h2>
            <p className="text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed text-balance text-center">
              Full-stack apps, ML systems, a custom engine, and team-built
              games. Filter by category here, or by skill above.
            </p>
          </div>
        </div>

        <LayoutGroup>
          <div
            id="project-filters"
            role="group"
            aria-label="Filter projects by focus"
            // The tabs sit on a rail: a 1px line under the group that the
            // active tab's light bar rides on.
            className="relative flex scroll-mt-24 flex-wrap items-center justify-center gap-2 pb-3 after:absolute after:inset-x-[10%] after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent"
          >
            {PROJECT_FILTERS.map((tab) => {
              const isActive = tab.value === activeFilter?.value;
              // Each tab is lit in its category's light (blue for All),
              // so the row doubles as the legend for the card colors.
              const light = "light" in tab ? LIGHT_CLASS[tab.light] : undefined;
              const count = GRID_PROJECTS.filter((p) =>
                matchesFilter(p, tab)
              ).length;
              return (
                <button
                  key={tab.value}
                  aria-pressed={isActive}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    light,
                    "relative rounded-sm border px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "border-brand/40 text-foreground"
                      : "border-brand/25 bg-card/60 text-muted-foreground hover:text-foreground hover:border-brand/50"
                  )}
                >
                  {/* At rest each tab keeps a short lit under-edge. */}
                  {!isActive && (
                    <span
                      className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-70"
                      aria-hidden
                    />
                  )}
                  {/* The active tab is a light bar that slides between
                      tabs, over a faint wash. */}
                  {isActive && (
                    <motion.span
                      layoutId="project-filter-pill"
                      className="absolute inset-0 rounded-sm bg-brand-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden
                    >
                      <span className="absolute inset-x-1.5 -bottom-px h-[2px] bg-brand-2 shadow-[0_0_8px_1px_var(--brand-glow)]" />
                    </motion.span>
                  )}
                  <span className="relative z-10">
                    {tab.label}
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        "text-brand"
                      )}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
            {/* A skill picked in the Skills section shows up as its own
                active tab, lit in the skill's light; × clears it. */}
            {skill && (
              <button
                type="button"
                aria-pressed
                onClick={() => setFilter("all")}
                aria-label={`Showing projects that use ${skill.name}. Clear`}
                className={cn(
                  LIGHT_CLASS[skill.light],
                  "relative inline-flex items-center gap-1.5 rounded-sm border border-brand/40 px-3 py-1 text-xs font-mono uppercase tracking-wider text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <motion.span
                  layoutId="project-filter-pill"
                  className="absolute inset-0 rounded-sm bg-brand-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  aria-hidden
                >
                  <span className="absolute inset-x-1.5 -bottom-px h-[2px] bg-brand-2 shadow-[0_0_8px_1px_var(--brand-glow)]" />
                </motion.span>
                <span className="relative z-10">
                  {skill.name}
                  <span className="ml-1.5 tabular-nums text-brand">{visible.length}</span>
                </span>
                <X className="relative z-10 size-3 text-muted-foreground" aria-hidden />
              </button>
            )}
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto w-full"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((project, i) => (
                <motion.div
                  key={project.slug}
                  layout="position"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: (i % 2) * 0.06 }}
                  className="h-full"
                >
                  <ProjectCard
                    href={project.href}
                    title={project.title}
                    description={project.summary}
                    tags={project.technologies}
                    status={project.status}
                    image={project.image}
                    video={project.video}
                    poster={project.poster}
                    shots={project.shots}
                    links={project.links}
                    light={projectLightClass(project)}
                    categories={project.categories}
                    lightStyle={projectLightStyle(project)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {visible.length === 0 && (
              <div className="sm:col-span-2 rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                Nothing to show in this slice yet.{" "}
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  See everything
                </button>
                .
              </div>
            )}
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}
