"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BlurFade from "@/components/magicui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { DATA, PROJECT_FILTERS } from "@/data/resume";
import { cn } from "@/lib/utils";

const BLUR_FADE_DELAY = 0.04;

export default function ProjectsSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const focus = searchParams.get("focus") ?? "all";
    const activeFilter =
        PROJECT_FILTERS.find((f) => f.value === focus) ?? PROJECT_FILTERS[0];

    const visible = useMemo(() => {
        if (activeFilter.value === "all") return DATA.projects;
        const match = "matches" in activeFilter ? activeFilter.matches : null;
        if (!match) return DATA.projects;
        return DATA.projects.filter((p) =>
            (p.categories as readonly string[]).includes(match)
        );
    }, [activeFilter]);

    const setFilter = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") params.delete("focus");
        else params.set("focus", value);
        const query = params.toString();
        const next = query ? `/?${query}#projects` : `/#projects`;
        router.replace(next, { scroll: false });
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
                            Work across full-stack, ML, systems, and team-built games.
                            Filter to the slice you&apos;re hiring for.
                        </p>
                    </div>
                </div>

                <div
                    role="tablist"
                    aria-label="Filter projects by focus"
                    className="flex flex-wrap items-center justify-center gap-2"
                >
                    {PROJECT_FILTERS.map((filter) => {
                        const isActive = filter.value === activeFilter.value;
                        return (
                            <button
                                key={filter.value}
                                role="tab"
                                aria-selected={isActive}
                                type="button"
                                onClick={() => setFilter(filter.value)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-xs font-mono transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    isActive
                                        ? "border-foreground/40 bg-foreground text-background"
                                        : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                )}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto auto-rows-fr">
                    {visible.map((project, id) => (
                        <BlurFade
                            key={project.title}
                            delay={BLUR_FADE_DELAY * 12 + id * 0.05}
                            className="h-full"
                        >
                            <ProjectCard
                                href={project.href}
                                key={project.title}
                                title={project.title}
                                description={project.summary}
                                dates={project.dates}
                                tags={project.technologies}
                                status={project.status}
                                image={project.image}
                                video={project.video}
                                links={project.links}
                            />
                        </BlurFade>
                    ))}
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
                </div>
            </div>
        </section>
    );
}
