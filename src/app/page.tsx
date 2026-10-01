import BlurFade from "@/components/magicui/blur-fade";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CURRENT_ROLE, DATA } from "@/data";
import Link from "next/link";
import Markdown from "react-markdown";
import ContactSection from "@/components/section/contact-section";
import ProjectsSection from "@/components/section/projects-section";
import ExperienceSection from "@/components/section/experience-section";
import { EducationLogo } from "@/components/education-logo";
import { HashLink } from "@/components/hash-link";
import { ScrollCue } from "@/components/scroll-cue";
import { HeroStats } from "@/components/hero-stats";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight, FileText, Github, Linkedin, Mail, Sparkles } from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

// Hero text animates with CSS (tw-animate-css) rather than motion, so it
// paints from the server HTML without waiting on hydration. Reduced-motion
// users get it static.
const enter = (delay: string) =>
  cn(
    "motion-safe:animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both",
    delay
  );

const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: DATA.name,
  url: DATA.url,
  image: new URL(DATA.avatarUrl, DATA.url).toString(),
  jobTitle: CURRENT_ROLE?.title,
  worksFor: CURRENT_ROLE
    ? { "@type": "Organization", name: CURRENT_ROLE.company, url: CURRENT_ROLE.companyUrl }
    : undefined,
  alumniOf: DATA.education.map((e) => ({
    "@type": "CollegeOrUniversity",
    name: e.school,
    url: e.href,
  })),
  sameAs: [DATA.contact.social.GitHub.url, DATA.contact.social.LinkedIn.url],
};

export default function Page() {
  return (
    <main className="min-h-dvh flex flex-col gap-16 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
      />

      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 gap-y-6 flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-3 order-2 md:order-1">
              {CURRENT_ROLE && (
                <span className={cn("hud-glow w-fit", enter("delay-0"))}>
                  <HashLink
                    targetId="experience"
                    className="hud hud-hover group inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [--cut:6px]"
                  >
                    {/* Square status light, not a pulsing dot. */}
                    <span className="inline-flex size-1.5 bg-brand shadow-[0_0_6px_1px_var(--brand-glow)]" />
                    Now · {CURRENT_ROLE.title} at {CURRENT_ROLE.company}
                    <ArrowRight className="size-3 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </HashLink>
                </span>
              )}
              <h1
                className={cn(
                  "glow-soft text-4xl font-semibold tracking-tighter sm:text-5xl lg:text-6xl",
                  enter("delay-75")
                )}
              >
                <span className="text-rez">{DATA.name}</span>
              </h1>
              <p
                className={cn(
                  "text-muted-foreground max-w-[520px] md:text-lg text-pretty",
                  enter("delay-150")
                )}
              >
                {DATA.description}
              </p>
            </div>
            <div className={cn("order-1 md:order-2 shrink-0", enter("delay-100"))}>
              {/* Identity disc, after the platform rings in the key art:
                  concentric rings of different weights with gaps. A thin
                  segmented outer ring (with one red arc) turns one way, a
                  heavy broken inner ring turns the other. */}
              <div className="relative size-24 md:size-32">
                <svg
                  className="disc-ring pointer-events-none absolute -inset-[10px] h-[calc(100%+20px)] w-[calc(100%+20px)]"
                  viewBox="0 0 100 100"
                  aria-hidden
                >
                  <circle
                    cx="50" cy="50" r="49" fill="none"
                    className="stroke-brand" strokeWidth="0.5"
                    pathLength={360} strokeDasharray="26 3 5 3" opacity="0.7"
                  />
                  <circle
                    cx="50" cy="50" r="49" fill="none"
                    className="stroke-tron-red" strokeWidth="1.3"
                    pathLength={360} strokeDasharray="14 346" strokeDashoffset="-40"
                  />
                </svg>
                <svg
                  className="disc-ring-rev pointer-events-none absolute -inset-[10px] h-[calc(100%+20px)] w-[calc(100%+20px)]"
                  viewBox="0 0 100 100"
                  aria-hidden
                >
                  <circle
                    cx="50" cy="50" r="45.6" fill="none"
                    className="stroke-brand" strokeWidth="1.6"
                    pathLength={360} strokeDasharray="96 12 52 12 140 48"
                    opacity="0.85"
                  />
                </svg>
                <Avatar className="disc-rim relative size-24 md:size-32 border-2 border-background rounded-full">
                  <AvatarImage alt={DATA.name} src={DATA.avatarUrl} />
                  <AvatarFallback className="font-mono text-2xl md:text-3xl">
                    {DATA.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <HeroStats />
          </BlurFade>

          <div className={cn("flex flex-wrap items-center gap-2", enter("delay-300"))}>
            <span className="hud-glow">
              <Link
                href="/resume"
                className="hud hud-lit inline-flex h-8 items-center gap-1.5 px-3.5 text-xs font-medium text-foreground [--cut:7px] [--hud-fill:color-mix(in_oklch,var(--brand)_14%,var(--card))]"
              >
                <FileText className="size-3.5" aria-hidden />
                Resume
              </Link>
            </span>
            <span className="hud-glow">
              <HashLink
                targetId="projects"
                className="hud hud-hover inline-flex h-8 items-center px-3.5 text-xs font-medium text-foreground/90 [--cut:7px]"
              >
                See my projects
              </HashLink>
            </span>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" className="size-8">
                <a
                  href={DATA.contact.social.GitHub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="size-4" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon" className="size-8">
                <a
                  href={DATA.contact.social.LinkedIn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="size-4" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon" className="size-8">
                <a href={`mailto:${DATA.contact.email}`} aria-label="Email">
                  <Mail className="size-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>

          <p
            className={cn(
              "hidden sm:block font-mono text-[11px] leading-relaxed text-muted-foreground/70",
              enter("delay-500")
            )}
          >
            <Sparkles className="mr-1.5 inline size-3 -translate-y-px text-brand" aria-hidden />
            The particles up top run a TypeScript port of my C++ engine&apos;s
            emitter. Click empty space to burst it, or{" "}
            <Link
              href="/projects/mayhem-engine#playground"
              className="underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-brand"
            >
              edit its JSON
            </Link>
            .
          </p>

          <ScrollCue
            targetId="experience"
            className={cn(
              "mx-auto mt-2 hidden sm:flex w-fit flex-col items-center gap-1 text-muted-foreground/50 motion-safe:animate-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            )}
          />
        </div>
      </section>

      <section id="about">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade>
            <h2 className="section-title text-xl font-bold">About</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY}>
            <div className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{DATA.summary}</Markdown>
            </div>
          </BlurFade>
        </div>
      </section>

      <section id="experience">
        <ExperienceSection />
      </section>

      <section id="projects">
        <ProjectsSection />
      </section>

      <section id="skills">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade>
            <h2 className="section-title text-xl font-bold">Skills</h2>
          </BlurFade>
          <div className="flex flex-col gap-5">
            {DATA.skillGroups.map((group, gIdx) => (
              <BlurFade key={group.label} delay={gIdx * 0.06}>
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((skill) => (
                      <div
                        key={skill.name}
                        className="group border border-border border-b-2 border-b-brand/35 bg-card/60 rounded-md h-8 w-fit px-3 flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:border-b-brand hover:shadow-[0_6px_16px_-10px_var(--brand)]"
                      >
                        {skill.icon && (
                          <skill.icon className="size-4 rounded overflow-hidden object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                        )}
                        <span className="text-foreground text-sm font-medium">
                          {skill.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <section id="education">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade>
            <h2 className="section-title text-xl font-bold">Education</h2>
          </BlurFade>
          <div className="flex flex-col gap-8">
            {DATA.education.map((education, index) => (
              <BlurFade key={education.school} delay={index * 0.05}>
                <Link
                  href={education.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-x-3 justify-between group"
                >
                  <div className="flex items-center gap-x-3 flex-1 min-w-0">
                    <EducationLogo
                      src={education.logoUrl}
                      alt={education.school}
                      fallbackInitials="DP"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="font-semibold leading-none flex items-center gap-2">
                        {education.school}
                        <ArrowUpRight
                          className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          aria-hidden
                        />
                      </div>
                      <div className="font-sans text-sm text-muted-foreground">
                        {education.degree}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-muted-foreground text-right flex-none">
                    <span>
                      {education.start} – {education.end}
                    </span>
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <BlurFade>
          <ContactSection />
        </BlurFade>
      </section>
    </main>
  );
}
