"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

// Four numbers from real projects, each linking to its case study. They
// count up once on load. The final value is in the server HTML (crawlers
// and no-JS readers get real numbers); the row itself sits inside a
// BlurFade, which keeps it invisible until hydration, so resetting to 0
// before counting never flashes.

const STATS = [
  { value: 114, suffix: "", label: "API handlers", project: "SquadPact", href: "/projects/squadpact" },
  { value: 148, suffix: "", label: "ML features", project: "StockAI", href: "/projects/stockai" },
  { value: 16, suffix: "", label: "generations to 3 stars", project: "Genetic AI", href: "/projects/zeppelin-rush" },
  { value: 10000, suffix: "+", label: "employees reached", project: "Spur Reply", href: "/projects/spur-2020" },
] as const;

const fmt = new Intl.NumberFormat("en-US");

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
        <li key={s.label} className="hud-glow">
          {/* Chamfered HUD readout; the edge is lit from below and fully
              lit on hover. */}
          <Link
            href={s.href}
            className="hud hud-hover group flex h-full flex-col gap-0.5 px-3 py-2.5 [--cut:10px] focus-visible:outline-none"
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
          </Link>
        </li>
      ))}
    </ul>
  );
}
