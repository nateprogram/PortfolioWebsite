/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";

const BLUR_FADE_DELAY = 0.04;

export async function generateStaticParams() {
  return DATA.projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = DATA.projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = DATA.projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className="min-h-dvh flex flex-col gap-10 relative">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <Link
          href="/#projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm w-fit"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All projects
        </Link>
      </BlurFade>

      <header className="flex flex-col gap-4">
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  project.status === "Active"
                    ? "bg-emerald-500"
                    : project.status === "Coursework"
                    ? "bg-sky-500"
                    : "bg-muted-foreground"
                )}
                aria-hidden
              />
              {project.status}
            </span>
            <span aria-hidden>·</span>
            <span>{project.dates}</span>
            {project.categories && project.categories.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{project.categories.join(" / ")}</span>
              </>
            )}
          </div>
        </BlurFade>

        <BlurFade delay={BLUR_FADE_DELAY * 3}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tighter">
            {project.title}
          </h1>
        </BlurFade>

        <BlurFade delay={BLUR_FADE_DELAY * 4}>
          <p className="text-muted-foreground md:text-lg text-balance">
            {project.summary}
          </p>
        </BlurFade>
      </header>

      {(project.video || project.image) && (
        <BlurFade delay={BLUR_FADE_DELAY * 5}>
          <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
            {project.video ? (
              <video
                src={project.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover"
              />
            ) : project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-auto object-cover"
              />
            ) : null}
          </div>
        </BlurFade>
      )}

      {project.links && project.links.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 6}>
          <section className="flex flex-wrap gap-2">
            {project.links.map((link) => (
              <Link
                key={link.type}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:border-foreground/30 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {link.icon}
                {link.type}
              </Link>
            ))}
          </section>
        </BlurFade>
      )}

      <BlurFade delay={BLUR_FADE_DELAY * 7}>
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Overview
          </h2>
          <div className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
            <Markdown>{project.description}</Markdown>
          </div>
        </section>
      </BlurFade>

      {project.technologies && project.technologies.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 8}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Stack
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="text-[11px] font-medium border border-border h-6 px-2"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </section>
        </BlurFade>
      )}

      <BlurFade delay={BLUR_FADE_DELAY * 9}>
        <section className="flex flex-col gap-3 border-t border-border pt-8">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            More to come
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            A deeper write-up is in the works — problem framing, key decisions
            and rejected alternatives, architecture notes, and outcomes. In the
            meantime, reach out at{" "}
            <a
              href={`mailto:${DATA.contact.email}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {DATA.contact.email}
            </a>{" "}
            for a walkthrough.
          </p>
        </section>
      </BlurFade>
    </main>
  );
}
