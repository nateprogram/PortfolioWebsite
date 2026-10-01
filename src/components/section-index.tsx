"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Mail } from "lucide-react";
import { Icons } from "@/components/icons";
import { HashLink } from "@/components/hash-link";
import { ModeToggle } from "@/components/mode-toggle";
import { DATA } from "@/data";
import { cn } from "@/lib/utils";

// Desktop navigation: a quiet index in the left margin that tracks which
// homepage section is in view. Phones and tablets keep the bottom dock
// (navbar.tsx is lg:hidden; this is hidden below lg).
//
// On other pages the same index links back to the homepage sections, and
// the current page (Resume, or Projects for a case study) is marked.

const SECTIONS = [
  { id: "hero", label: "Intro" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
] as const;

const itemClass =
  "group flex items-center gap-3 py-1 font-mono text-[11px] uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

// Each tick branches off a vertical bus line (see the <ol>). The active
// tick is a 2px cyan core with a short red underline: weight contrast
// plus the tertiary mark, instead of a single hairline.
function Tick({ active }: { active: boolean }) {
  return (
    <span aria-hidden className="relative flex shrink-0 items-center">
      <span
        className={cn(
          "block transition-all duration-300 ease-out",
          active
            ? "h-[2px] w-8 bg-gradient-to-r from-brand to-brand-2 shadow-[0_0_8px_0_var(--brand-glow)]"
            : "h-px w-3 bg-muted-foreground/40 group-hover:w-5 group-hover:bg-foreground/60"
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-[5px] h-px bg-tron-red transition-all duration-300",
          active ? "w-2.5 opacity-100" : "w-0 opacity-0"
        )}
      />
    </span>
  );
}

function Label({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "transition-colors",
        active ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground"
      )}
    >
      {children}
    </span>
  );
}

export function SectionIndex() {
  const pathname = usePathname() ?? "/";
  const onHome = pathname === "/";
  const [active, setActive] = useState<string>("hero");

  // Clicking an item pins it as current while the smooth scroll runs,
  // and it stays lit until the user scrolls again; otherwise short
  // sections near the bottom (which can't scroll up to the reading line)
  // would light up their neighbor instead.
  const pinnedRef = useRef<string | null>(null);

  // Scroll-spy: the current section is the last one whose top has passed
  // a reading line at 35% of the viewport. At the very bottom of the
  // page, the last section wins.
  useEffect(() => {
    if (!onHome) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (pinnedRef.current) return;
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
        setActive(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      const line = window.innerHeight * 0.35;
      let current: string = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    // When a clicked scroll settles, keep the clicked item lit; the spy
    // takes over again on the user's next scroll.
    const unpin = () => {
      pinnedRef.current = null;
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scrollend", unpin);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scrollend", unpin);
    };
  }, [onHome]);

  const pin = (id: string) => {
    pinnedRef.current = id;
    setActive(id);
    // Fallback for browsers without `scrollend`.
    window.setTimeout(() => {
      if (pinnedRef.current === id) pinnedRef.current = null;
    }, 1200);
  };

  const currentId = onHome
    ? active
    : pathname.startsWith("/projects")
      ? "projects"
      : null;
  const onResume = pathname.startsWith("/resume");

  return (
    <nav
      aria-label="Sections"
      className="fixed top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-5 lg:flex print:hidden"
      // Hug the content column (max-w-2xl = 672px) on wide screens; never
      // closer than 1.5rem to the window edge.
      style={{ left: "max(1.5rem, calc(50% - 336px - 13rem))" }}
    >
      <ol className="relative flex flex-col before:absolute before:-left-2 before:top-2.5 before:bottom-2.5 before:w-px before:bg-border">
        {SECTIONS.map((s) => {
          const isActive = currentId === s.id;
          const content = (
            <>
              <Tick active={isActive} />
              <Label active={isActive}>{s.label}</Label>
            </>
          );
          return (
            <li key={s.id}>
              {onHome ? (
                <HashLink
                  targetId={s.id}
                  className={itemClass}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => pin(s.id)}
                >
                  {content}
                </HashLink>
              ) : (
                <Link
                  href={s.id === "hero" ? "/" : `/#${s.id}`}
                  className={itemClass}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <div className="h-px w-8 bg-border" aria-hidden />

      <Link
        href="/resume"
        className={itemClass}
        aria-current={onResume ? "page" : undefined}
      >
        <Tick active={onResume} />
        <Label active={onResume}>
          <span className="inline-flex items-center gap-1">
            Resume
            <ArrowUpRight className="size-3 opacity-60" aria-hidden />
          </span>
        </Label>
      </Link>

      <div className="flex items-center gap-0.5 pl-6 text-muted-foreground">
        <a
          href={DATA.contact.social.GitHub.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icons.github className="size-4" />
        </a>
        <a
          href={DATA.contact.social.LinkedIn.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icons.linkedin className="size-4" />
        </a>
        <a
          href={`mailto:${DATA.contact.email}`}
          aria-label="Email"
          className="rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Mail className="size-4" />
        </a>
        <ModeToggle className="size-7 p-1.5 text-muted-foreground hover:text-foreground" />
      </div>
    </nav>
  );
}
