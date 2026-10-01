"use client";

import { useMemo, useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ProjectCard } from "@/components/project-card";
import { DATA, PROJECT_FILTERS } from "@/data";
import { cn } from "@/lib/utils";

// The active filter lives in the URL (`?focus=ai-ml`) so a filtered view
// can be shared. It's read through useSyncExternalStore rather than
// useSearchParams: the server snapshot is "all", so the full grid is in
// the prerendered HTML (crawlers and link previews see every project)
// and the client swaps to the URL's filter right after hydration.

const FOCUS_EVENT = "projects:focus";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(FOCUS_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(FOCUS_EVENT, onChange);
  };
}
const getSnapshot = () =>
  new URLSearchParams(window.location.search).get("focus") ?? "all";
const getServerSnapshot = () => "all";

const GRID_PROJECTS = DATA.projects.filter((p) => !p.hideFromGrid);

function matchesFilter(
  project: (typeof GRID_PROJECTS)[number],
  filter: (typeof PROJECT_FILTERS)[number]
) {
  if (!("matches" in filter)) return true;
  return project.categories.includes(filter.matches);
}

export default function ProjectsSection() {
  const focus = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const activeFilter =
    PROJECT_FILTERS.find((f) => f.value === focus) ?? PROJECT_FILTERS[0];

  const visible = useMemo(
    () => GRID_PROJECTS.filter((p) => matchesFilter(p, activeFilter)),
    [activeFilter]
  );

  const setFilter = (value: string) => {
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("focus");
    else url.searchParams.set("focus", value);
    url.hash = "projects";
    // Passing history.state through keeps Next's router state intact.
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(FOCUS_EVENT));
  };

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
            <span className="h-px w-1 bg-tron-red" />
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
              games. Filter by what you want to see.
            </p>
          </div>
        </div>

        <LayoutGroup>
          <div
            role="group"
            aria-label="Filter projects by focus"
            // The tabs sit on a rail: a 1px line under the group that the
            // active tab's light bar rides on.
            className="relative flex flex-wrap items-center justify-center gap-2 pb-3 after:absolute after:inset-x-[10%] after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent"
          >
            {PROJECT_FILTERS.map((filter) => {
              const isActive = filter.value === activeFilter.value;
              const count = GRID_PROJECTS.filter((p) =>
                matchesFilter(p, filter)
              ).length;
              return (
                <button
                  key={filter.value}
                  aria-pressed={isActive}
                  type="button"
                  onClick={() => setFilter(filter.value)}
                  className={cn(
                    "relative rounded-sm border px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "border-brand/40 text-foreground"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-brand/30"
                  )}
                >
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
                      <span className="absolute left-1.5 -bottom-[5px] h-px w-3 bg-tron-red" />
                    </motion.span>
                  )}
                  <span className="relative z-10">
                    {filter.label}
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        isActive ? "text-tron-red" : "text-muted-foreground/60"
                      )}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
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
