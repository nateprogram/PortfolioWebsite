/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

function hashOf(s: string) {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function initialsOf(title: string): string {
  const caps = title.match(/[A-Z]/g);
  if (caps && caps.length >= 2) return caps.slice(0, 2).join("");
  if (caps && caps.length === 1) return caps[0];
  return title.slice(0, 2).toUpperCase();
}

type CoverCell = { points: string; lit: boolean; o: number; c: string };

// Hexagon mesh, after the pattern printed on the light suits. Seeded LCG
// so the same title always yields the same cover; ~1 in 9 cells is lit.
function coverCells(title: string): CoverCell[] {
  const R = 13;
  const w = Math.sqrt(3) * R;
  const vstep = 1.5 * R;
  const cells: CoverCell[] = [];
  let state = hashOf(title);
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 20; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0);
      const cy = row * vstep;
      const points = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 180) * (60 * k + 30);
        return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      const lit = rand() > 0.89;
      cells.push({
        points,
        lit,
        o: lit ? 0.9 : 0.1 + rand() * 0.12,
        c: lit ? (rand() > 0.6 ? "var(--brand-2)" : "var(--brand)") : "currentColor",
      });
    }
  }
  return cells;
}

// Deterministic cover for projects without a screenshot: the suits' hex
// mesh, seeded from the title, with a few cells lit.
function GeneratedCover({ title }: { title: string }) {
  const cells = coverCells(title);
  return (
    <div
      className="relative h-48 w-full overflow-hidden bg-muted/40 text-foreground"
      aria-hidden
    >
      <svg viewBox="0 0 400 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {cells.map((d, i) => (
          <polygon
            key={i}
            points={d.points}
            fill={d.lit ? d.c : "none"}
            fillOpacity={d.lit ? 0.16 : 0}
            stroke={d.c}
            strokeOpacity={d.o}
            strokeWidth={d.lit ? 1.1 : 0.7}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_90%)] opacity-70" />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <span className="text-light font-mono text-5xl font-bold tracking-tight transition-transform duration-500 group-hover/card:scale-105">
          {initialsOf(title)}
        </span>
      </div>
    </div>
  );
}

// Three phone screenshots fanned out; they spread apart on card hover.
function PhoneFan({ shots, title }: { shots: readonly string[]; title: string }) {
  const [left, center, right] = shots;
  const phone =
    "absolute bottom-[-38%] w-[30%] overflow-hidden rounded-[0.9rem] border-[3px] border-zinc-800 bg-black shadow-2xl transition-transform duration-500 ease-out";
  return (
    <div className="relative h-48 w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_100%,var(--brand-soft),transparent_70%)] bg-muted/30">
      {left && (
        <div
          className={cn(phone, "left-[10%] z-0 -rotate-[9deg] group-hover/card:-translate-x-3 group-hover/card:-rotate-[13deg]")}
        >
          <img src={left} alt="" loading="lazy" className="aspect-[1080/2125] w-full object-cover object-top" />
        </div>
      )}
      {right && (
        <div
          className={cn(phone, "right-[10%] z-0 rotate-[9deg] group-hover/card:translate-x-3 group-hover/card:rotate-[13deg]")}
        >
          <img src={right} alt="" loading="lazy" className="aspect-[1080/2125] w-full object-cover object-top" />
        </div>
      )}
      {center && (
        <div
          className={cn(phone, "left-1/2 z-10 -translate-x-1/2 bottom-[-30%] group-hover/card:-translate-y-2")}
        >
          <img
            src={center}
            alt={`${title} screenshot`}
            loading="lazy"
            className="aspect-[1080/2125] w-full object-cover object-top"
          />
        </div>
      )}
    </div>
  );
}

// Autoplay only while on screen, and never for reduced-motion users. The
// poster shows until then, so the mp4 isn't fetched on first load.
function InViewVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduceMotion]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      preload="none"
      loop
      muted
      playsInline
      aria-hidden
      className="w-full h-48 object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
    />
  );
}

function ProjectMedia({
  title,
  image,
  video,
  poster,
  shots,
}: {
  title: string;
  image?: string;
  video?: string;
  poster?: string;
  shots?: readonly string[];
}) {
  const [imageError, setImageError] = useState(false);

  if (video) return <InViewVideo src={video} poster={poster} />;
  if (shots && shots.length > 0) return <PhoneFan shots={shots} title={title} />;
  if (image && !imageError) {
    return (
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="w-full h-48 object-cover object-top transition-transform duration-500 group-hover/card:scale-[1.03]"
        onError={() => setImageError(true)}
      />
    );
  }
  return <GeneratedCover title={title} />;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface Props {
  title: string;
  href?: string;
  description: string;
  tags: readonly string[];
  status?: string;
  link?: string;
  image?: string;
  video?: string;
  poster?: string;
  shots?: readonly string[];
  links?: readonly {
    icon: React.ReactNode;
    type: string;
    href: string;
  }[];
  className?: string;
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href) || href.startsWith("mailto:");
}

export function ProjectCard({
  title,
  href,
  description,
  tags,
  image,
  video,
  poster,
  shots,
  links,
  className,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasPrimaryLink = !!href && href !== "#";
  const isExternal = hasPrimaryLink && isExternalHref(href!);
  const linkTargetProps = isExternal
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  // The spotlight follows the pointer via CSS variables written straight
  // onto the element: no React state, so moving the mouse never
  // re-renders the card. (A 3D tilt was tried and dropped: Chromium blurs
  // text under perspective transforms.)
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={onPointerMove}
      className={cn(
        "spotlight group/card relative flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card/40 transition-[translate,box-shadow] duration-300 ease-out",
        hasPrimaryLink &&
          "cursor-pointer motion-safe:hover:-translate-y-1 hover:shadow-[0_22px_45px_-24px_var(--brand)] focus-within:ring-2 focus-within:ring-ring",
        className
      )}
    >
      {/* Bracket corners over the panel; they light up with the card. */}
      <span aria-hidden className="tron-corners inset-[6px] z-20" />
      <div className="relative shrink-0 overflow-hidden border-b border-border/60">
        {hasPrimaryLink ? (
          <Link
            href={href!}
            {...linkTargetProps}
            className="block focus-visible:outline-none"
            tabIndex={-1}
            aria-hidden
          >
            <ProjectMedia title={title} image={image} video={video} poster={poster} shots={shots} />
          </Link>
        ) : (
          <ProjectMedia title={title} image={image} video={video} poster={poster} shots={shots} />
        )}
        {/* Status badge intentionally not rendered. The data field is kept on
            the project type for future filtering/logic, but surfacing labels
            like "Coursework" or "Active" on every card creates an implicit
            hierarchy between academic / personal / employed work. We'd rather
            every entry in the grid stand on its own merits; dates alone
            already communicate "currently shipping" vs "past". */}
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 z-20 flex flex-wrap gap-2">
            {links.map((link, idx) => (
              <Link
                href={link.href}
                key={idx}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="relative"
              >
                <Badge
                  className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-black/90"
                  variant="default"
                >
                  {link.icon}
                  {link.type}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="relative z-10 p-6 flex flex-col gap-3 flex-1">
        {hasPrimaryLink && (
          <Link
            href={href!}
            {...linkTargetProps}
            aria-label={`Open ${title}`}
            className="absolute inset-0 z-10 focus-visible:outline-none"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{title}</h3>
          {hasPrimaryLink && (
            <ArrowUpRight
              className="h-4 w-4 text-muted-foreground shrink-0 transition-all duration-300 group-hover/card:text-brand group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5"
              aria-hidden
            />
          )}
        </div>
        <div className="text-xs flex-1 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown>{description}</Markdown>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="text-[11px] font-medium border border-border h-6 w-fit px-2"
                variant="outline"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
