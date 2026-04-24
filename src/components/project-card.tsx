/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Markdown from "react-markdown";

function initialsOf(title: string): string {
  const caps = title.match(/[A-Z]/g);
  if (caps && caps.length >= 2) return caps.slice(0, 2).join("");
  if (caps && caps.length === 1) return caps[0];
  return title.slice(0, 2).toUpperCase();
}

function gradientFor(title: string): string {
  const palettes = [
    "from-emerald-500/25 via-sky-500/15 to-transparent",
    "from-violet-500/25 via-fuchsia-500/15 to-transparent",
    "from-amber-500/25 via-rose-500/15 to-transparent",
    "from-cyan-500/25 via-blue-500/15 to-transparent",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return palettes[hash % palettes.length];
}

function ProjectMedia({
  title,
  image,
  video,
}: {
  title: string;
  image?: string;
  video?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (video) {
    return (
      <video
        src={video}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-48 object-cover"
      />
    );
  }

  if (image && !imageError) {
    return (
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  const gradient = gradientFor(title);
  const initials = initialsOf(title);
  return (
    <div
      className={cn(
        "relative w-full h-48 overflow-hidden bg-muted/40",
        "bg-gradient-to-br",
        gradient
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25), transparent 40%)",
        }}
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <span className="font-mono text-5xl font-bold tracking-tight text-foreground/80">
          {initials}
        </span>
      </div>
    </div>
  );
}

interface Props {
  title: string;
  href?: string;
  description: string;
  tags: readonly string[];
  status?: string;
  link?: string;
  image?: string;
  video?: string;
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
  status,
  link,
  image,
  video,
  links,
  className,
}: Props) {
  const isPlaceholder = !video && !image;
  const hasPrimaryLink = !!href && href !== "#";
  const isExternal = hasPrimaryLink && isExternalHref(href!);
  const linkTargetProps = isExternal
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  return (
    <div
      className={cn(
        "flex flex-col h-full border border-border rounded-xl overflow-hidden transition-all duration-200",
        hasPrimaryLink &&
          "hover:ring-2 cursor-pointer hover:ring-muted focus-within:ring-2 focus-within:ring-ring",
        className
      )}
    >
      <div className="relative shrink-0">
        {hasPrimaryLink ? (
          <Link
            href={href!}
            {...linkTargetProps}
            className="block focus-visible:outline-none"
            tabIndex={-1}
            aria-hidden
          >
            <ProjectMedia title={title} image={image} video={video} />
          </Link>
        ) : (
          <ProjectMedia title={title} image={image} video={video} />
        )}
        {/* Status badge intentionally not rendered. The data field is kept on
            the project type for future filtering/logic, but surfacing labels
            like "Coursework" or "Active" on every card creates an implicit
            hierarchy between academic / personal / employed work. We'd rather
            every entry in the grid stand on its own merits — dates alone
            already communicate "currently shipping" vs "past". */}
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-2">
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
        {isPlaceholder && (
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <span className="rounded-md border border-border/60 bg-background/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
              Media soon
            </span>
          </div>
        )}
      </div>
      <div className="relative p-6 flex flex-col gap-3 flex-1">
        {hasPrimaryLink && (
          <Link
            href={href!}
            {...linkTargetProps}
            aria-label={`Open ${title}`}
            className="absolute inset-0 z-10 focus-visible:outline-none"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{title}</h3>
          </div>
          {hasPrimaryLink && (
            <ArrowUpRight
              className="h-4 w-4 text-muted-foreground shrink-0"
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
