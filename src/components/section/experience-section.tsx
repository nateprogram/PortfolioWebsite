"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { EXPERIENCE, type ExperienceEntry } from "@/data";
import { cn } from "@/lib/utils";

// Work history as a light-cycle run, after TRON: Legacy. A cycle head
// (white-hot core, cyan halo) travels down the rail as the section
// scrolls, laying a light ribbon behind it. At each role the ribbon bends
// into the title (Legacy's cycles turn at any angle, not just 90°).
// Ribbons in the film can be switched on and off, so current roles keep
// theirs lit and past roles' go dark once the cycle has passed. No dots.
//
// Content comes from src/data/experience.ts, the same source as /resume
// and the PDF.

const VISIBLE_BULLETS = 3;

export default function ExperienceSection() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 75%", "end 55%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });
  const headTop = useTransform(progress, (v) => `${v * 100}%`);
  const headOpacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);

  return (
    <div className="flex min-h-0 flex-col gap-y-6">
      <h2 className="section-title text-xl font-bold">Experience</h2>
      <ol ref={listRef} className="relative">
        {/* The grid line the cycle rides on: a 2px rail. */}
        <div
          className="absolute left-[10px] top-3 bottom-2 w-[2px] bg-border"
          aria-hidden
        />
        {/* The light ribbon laid behind the cycle. */}
        <motion.div
          className="absolute left-[10px] top-3 bottom-2 w-[2px] origin-top bg-brand shadow-[0_0_6px_0_var(--brand-glow)]"
          style={{ scaleY: reduceMotion ? 1 : progress }}
          aria-hidden
        />
        {/* The cycle head: a white-hot tip with a short tail behind it. */}
        {!reduceMotion && (
          <div className="pointer-events-none absolute left-[10px] top-3 bottom-2 w-[2px]" aria-hidden>
            <motion.span
              className="absolute -left-[0.5px] -mt-[22px] h-[22px] w-[3px] rounded-full bg-gradient-to-b from-transparent via-brand to-brand-2 shadow-[0_6px_10px_0_var(--brand-glow)]"
              style={{ top: headTop, opacity: headOpacity }}
            />
          </div>
        )}
        {EXPERIENCE.map((entry) => (
          <TimelineItem
            key={`${entry.company}-${entry.start}`}
            entry={entry}
            forceLit={!!reduceMotion}
          />
        ))}
      </ol>
    </div>
  );
}

function TimelineItem({
  entry,
  forceLit,
}: {
  entry: ExperienceEntry;
  forceLit: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  // Roughly tracks where the drawn line is (its end offset is 55%).
  const reached = useInView(ref, { once: true, margin: "0px 0px -45% 0px" });
  const lit = forceLit || reached;
  const isCurrent = entry.end === null;
  const [expanded, setExpanded] = useState(false);
  const shown = entry.bullets.slice(0, VISIBLE_BULLETS);
  const extra = entry.bullets.slice(VISIBLE_BULLETS);

  return (
    <li ref={ref} className="relative pl-10 pb-10 last:pb-0">
      {/* The ribbon bending off the rail into this role's title (2px), and
          a 1px companion line running down beside the rail that turns in
          at the bottom: together they form a channel around the entry
          without closing it. Lit for current roles; switched off (dim)
          for past ones, the way Legacy's cycles toggle their ribbons. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-[10px] top-0 h-[13px] w-[24px] rounded-bl-[10px] border-b-2 border-l-2 transition-[border-color,filter] duration-500",
          !lit && "border-border",
          lit && isCurrent && "border-brand drop-shadow-[0_0_4px_var(--brand-glow)]",
          lit && !isCurrent && "border-brand/45"
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute left-[18px] top-[22px] bottom-[22px] w-[6px] rounded-bl-[4px] border-b border-l transition-colors duration-500",
          !lit && "border-border/70",
          lit && isCurrent && "border-brand/60",
          lit && !isCurrent && "border-brand/25"
        )}
      />

      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={lit ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">
              {entry.title}{" "}
              <span className="text-muted-foreground font-normal">at</span>{" "}
              {entry.companyUrl ? (
                <a
                  href={entry.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-border underline-offset-4 hover:decoration-brand transition-colors"
                >
                  {entry.company}
                </a>
              ) : (
                entry.company
              )}
            </h3>
            <div className="text-xs text-muted-foreground">
              {[entry.companyNote, entry.location].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {entry.start} -{" "}
            <span className={cn(isCurrent && "text-brand")}>
              {entry.end ?? "Present"}
            </span>
          </div>
        </div>

        {entry.blurb && (
          <p className="text-sm text-muted-foreground text-pretty">
            {entry.blurb}
          </p>
        )}

        {shown.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {shown.map((b) => (
              <Bullet key={b}>{b}</Bullet>
            ))}
            <AnimatePresence initial={false}>
              {expanded &&
                extra.map((b) => (
                  <motion.li
                    key={b}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <BulletBody>{b}</BulletBody>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {entry.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-border border-l-2 border-l-brand/50 bg-card/60 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-foreground/80"
            >
              {tag}
            </span>
          ))}
          {extra.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? "Show less" : `Show ${extra.length} more`}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  expanded && "rotate-180"
                )}
                aria-hidden
              />
            </button>
          )}
          {entry.projectSlug && (
            <Link
              href={`/projects/${entry.projectSlug}`}
              className="group inline-flex items-center gap-1 text-xs font-medium text-foreground/90 hover:text-brand transition-colors"
            >
              Case study
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          )}
        </div>
      </motion.div>
    </li>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <li>
      <BulletBody>{children}</BulletBody>
    </li>
  );
}

function BulletBody({ children }: { children: string }) {
  return (
    <span className="flex gap-2">
      {/* A 2px dash with a shorter 1px dash under it. */}
      <span className="mt-[0.62em] flex shrink-0 flex-col gap-[2px]" aria-hidden>
        <span className="h-[2px] w-2 bg-brand/70" />
        <span className="h-px w-1 bg-brand/35" />
      </span>
      <span className="text-pretty leading-relaxed">{children}</span>
    </span>
  );
}
