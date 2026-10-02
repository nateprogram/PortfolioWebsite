"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { DATA, projectLightClass, projectLightStyle } from "@/data";
import { cn } from "@/lib/utils";

// Four numbers from real projects, each linking to its case study. They
// count up once on load. The final value is in the server HTML (crawlers
// and no-JS readers get real numbers); the row itself sits inside a
// BlurFade, which keeps it invisible until hydration, so resetting to 0
// before counting never flashes.

// Labels are a few plain words, so the number means something to someone
// who hasn't read the case study yet; the project name under it links to
// the full story.
const STATS = [
  { value: 114, suffix: "", label: "API endpoints", project: "SquadPact", href: "/projects/squadpact" },
  { value: 148, suffix: "", label: "market signals modeled", project: "StockAI", href: "/projects/stockai" },
  { value: 14, suffix: "", label: "rounds to beat humans", project: "Genetic AI", href: "/projects/zeppelin-rush" },
  { value: 10000, suffix: "+", label: "Microsoft employees reached", project: "Spur Reply", href: "/projects/spur-2020" },
] as const;

const fmt = new Intl.NumberFormat("en-US");

const projectFor = (href: string) => DATA.projects.find((p) => p.href === href);

function lightFor(href: string) {
  const project = projectFor(href);
  return project ? projectLightClass(project) : undefined;
}

function CountUp({ value, suffix, delay }: { value: number; suffix: string; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const final = `${fmt.format(value)}${suffix}`;
    if (reduceMotion) {
      el.textContent = final;
      return;
    }
    el.textContent = `0${suffix}`;
    const controls = animate(0, value, {
      duration: 1.4,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = `${fmt.format(Math.round(v))}${suffix}`;
      },
    });
    return () => {
      controls.stop();
      el.textContent = final;
    };
  }, [value, suffix, delay, reduceMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {fmt.format(value)}
      {suffix}
    </span>
  );
}

export function HeroStats() {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STATS.map((s, i) => (
        <li
          key={s.label}
          // Each readout is lit in its project's category light.
          className={cn("hud-glow", lightFor(s.href))}
          // A project in two categories (Genetic AI: AI/ML + Systems) gets
          // a seam that blends from its main light into the second.
          style={projectFor(s.href) && projectLightStyle(projectFor(s.href)!)}
        >
          {/* Chamfered HUD readout with an inner parallel trace; the edge
              is lit from below and fully lit on hover. */}
          <Link
            href={s.href}
            className="hud hud-hover hud-detail group flex h-full flex-col gap-0.5 px-3.5 pb-3 pt-2.5 [--cut:10px] focus-visible:outline-none"
          >
            <span className="text-light text-2xl font-semibold tracking-tight">
              <CountUp value={s.value} suffix={s.suffix} delay={0.25 + i * 0.12} />
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {s.label}
            </span>
            <span className="mt-auto pt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 transition-colors group-hover:text-brand">
              {s.project} →
            </span>
            {projectFor(s.href) && projectLightStyle(projectFor(s.href)!) && (
              <span aria-hidden className="light-seam absolute inset-x-3 bottom-[3px] h-px" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
