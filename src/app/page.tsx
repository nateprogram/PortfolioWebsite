/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DATA } from "@/data/resume";
import Link from "next/link";
import Markdown from "react-markdown";
import ContactSection from "@/components/section/contact-section";
import ProjectsSection from "@/components/section/projects-section";
import { ArrowUpRight, ChevronDown, Github, Linkedin, Mail } from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

export default function Page() {
  return (
    <main className="min-h-dvh flex flex-col gap-16 relative">
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 gap-y-6 flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-3 order-2 md:order-1">
              <BlurFade delay={BLUR_FADE_DELAY}>
                <Link
                  href="#contact"
                  className="group inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30"
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  {DATA.availability}
                </Link>
              </BlurFade>
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-3xl font-semibold tracking-tighter sm:text-4xl lg:text-5xl"
                yOffset={8}
                text={DATA.name}
              />
              <BlurFadeText
                delay={BLUR_FADE_DELAY * 1.5}
                className="text-xs sm:text-sm font-mono text-muted-foreground"
                text={DATA.role}
              />
              <BlurFadeText
                className="text-muted-foreground max-w-[600px] md:text-lg"
                delay={BLUR_FADE_DELAY * 2}
                text={DATA.description}
              />
            </div>
            <BlurFade delay={BLUR_FADE_DELAY} className="order-1 md:order-2">
              <Avatar className="size-24 md:size-32 border rounded-full shadow-lg ring-4 ring-muted">
                <AvatarImage alt={DATA.name} src={DATA.avatarUrl} />
                <AvatarFallback className="font-mono text-2xl md:text-3xl">
                  {DATA.initials}
                </AvatarFallback>
              </Avatar>
            </BlurFade>
          </div>

          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link href="#projects">See my projects</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a
                  href={DATA.contact.social.GitHub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="size-3.5" aria-hidden />
                  GitHub
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a
                  href={DATA.contact.social.LinkedIn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="size-3.5" aria-hidden />
                  LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={`mailto:${DATA.contact.email}`}>
                  <Mail className="size-3.5" aria-hidden />
                  Email
                </a>
              </Button>
            </div>
          </BlurFade>

          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <Link
              href="#projects"
              aria-label="Scroll to projects"
              className="mx-auto mt-2 hidden sm:flex w-fit flex-col items-center gap-1 text-muted-foreground/50 motion-safe:animate-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest">
                Scroll
              </span>
              <ChevronDown className="size-4" aria-hidden />
            </Link>
          </BlurFade>
        </div>
      </section>

      <section id="about">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <h2 className="text-xl font-bold">About</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <div className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{DATA.summary}</Markdown>
            </div>
          </BlurFade>
        </div>
      </section>

      <section id="education">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-xl font-bold">Education</h2>
          </BlurFade>
          <div className="flex flex-col gap-8">
            {DATA.education.map((education, index) => (
              <BlurFade
                key={education.school}
                delay={BLUR_FADE_DELAY * 8 + index * 0.05}
              >
                <Link
                  href={education.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-x-3 justify-between group"
                >
                  <div className="flex items-center gap-x-3 flex-1 min-w-0">
                    {education.logoUrl ? (
                      <img
                        src={education.logoUrl}
                        alt={education.school}
                        className="size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden object-contain flex-none"
                      />
                    ) : (
                      <div className="size-10 rounded-full shadow ring-2 ring-border bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border flex items-center justify-center flex-none font-mono text-xs font-semibold text-foreground/80">
                        DP
                      </div>
                    )}
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

      <section id="skills">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 9}>
            <h2 className="text-xl font-bold">Skills</h2>
          </BlurFade>
          <div className="flex flex-col gap-5">
            {DATA.skillGroups.map((group, gIdx) => (
              <div key={group.label} className="flex flex-col gap-2">
                <BlurFade delay={BLUR_FADE_DELAY * 10 + gIdx * 0.05}>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </div>
                </BlurFade>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill, id) => (
                    <BlurFade
                      key={skill.name}
                      delay={BLUR_FADE_DELAY * 10 + gIdx * 0.05 + id * 0.03}
                    >
                      <div className="border bg-background border-border ring-2 ring-border/20 rounded-xl h-8 w-fit px-3 flex items-center gap-2">
                        {skill.icon && (
                          <skill.icon className="size-4 rounded overflow-hidden object-contain" />
                        )}
                        <span className="text-foreground text-sm font-medium">
                          {skill.name}
                        </span>
                      </div>
                    </BlurFade>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects">
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          <Suspense
            fallback={
              <div className="h-[480px] rounded-xl border border-dashed border-border/60" />
            }
          >
            <ProjectsSection />
          </Suspense>
        </BlurFade>
      </section>

      <section id="contact">
        <BlurFade delay={BLUR_FADE_DELAY * 16}>
          <ContactSection />
        </BlurFade>
      </section>
    </main>
  );
}
