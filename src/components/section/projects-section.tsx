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
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border via-95% to-transparent" />
            <div className="border bg-primary z-10 rounded-xl px-4 py-1">
              <span className="text-background text-sm font-medium">
                My Projects
              </span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border via-95% to-transparent" />
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
            className="flex flex-wrap items-center justify-center gap-2"
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
                    "relative rounded-full border px-3 py-1 text-xs font-mono transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "border-transparent text-background"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="project-filter-pill"
                      className="absolute inset-0 rounded-full bg-foreground"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10">
                    {filter.label}
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        isActive ? "text-background/60" : "text-muted-foreground/60"
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
