"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
} from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { EXPERIENCE, formatRange, type ExperienceEntry } from "@/data";
import { cn } from "@/lib/utils";

// Work history as a vertical timeline. The accent line draws itself as the
// section scrolls past, and each role's node lights up once the line
// reaches it. Content comes from src/data/experience.ts, the same source
// as /resume and the PDF.

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

  return (
    <div className="flex min-h-0 flex-col gap-y-6">
      <h2 className="text-xl font-bold">Experience</h2>
      <ol ref={listRef} className="relative">
        {/* Track + drawn progress. */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-border"
          aria-hidden
        />
        <motion.div
          className="absolute left-[11px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-brand via-brand to-brand-2"
          style={{ scaleY: reduceMotion ? 1 : progress }}
          aria-hidden
        />
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
      <span
        aria-hidden
        className={cn(
          "absolute left-[5px] top-[5px] size-[13px] rounded-full border-2 transition-all duration-500",
          lit
            ? "border-brand bg-brand shadow-[0_0_0_5px_var(--brand-soft)]"
            : "border-border bg-background"
        )}
      />
      {isCurrent && lit && (
        <span
          aria-hidden
          className="absolute left-[5px] top-[5px] size-[13px] rounded-full bg-brand/60 motion-safe:animate-ping"
        />
      )}

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
          <div className="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground">
            {isCurrent && (
              <span className="rounded-full border border-brand/40 bg-brand-soft px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand">
                Now
              </span>
            )}
            {formatRange(entry)}
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
              className="rounded-md border border-border bg-card/60 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
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
      <span
        className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60"
        aria-hidden
      />
      <span className="text-pretty leading-relaxed">{children}</span>
    </span>
  );
}
