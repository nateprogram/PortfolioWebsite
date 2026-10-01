"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DATA } from "@/data";

// Project pages draw their own Grid floor (grid-floor.tsx), so the band
// stays out of their way.
const PROJECT_PATHS = new Set(DATA.projects.map((p) => p.href));

// The band behind the top of every page. Other inner pages get a faint
// square lattice of light. The homepage's floor is part of its hero
// (grid-floor.tsx), so here it only gets the particle emitter. /resume
// gets nothing so it reads (and prints) like a document.
//
// Everything here except the emitter is CSS: no canvas, no JS loop.

const HeroEmitter = dynamic(
  () => import("@/components/hero-emitter").then((m) => m.HeroEmitter),
  { ssr: false }
);

function Lattice({ height, fadeAt }: { height: number; fadeAt: string }) {
  return (
    <div
      className="absolute inset-x-0 top-0 tron-lattice"
      style={{
        height,
        maskImage: `radial-gradient(ellipse 75% 100% at 50% 0%, black, transparent ${fadeAt})`,
        WebkitMaskImage: `radial-gradient(ellipse 75% 100% at 50% 0%, black, transparent ${fadeAt})`,
      }}
      aria-hidden
    />
  );
}

export function TopBackdrop() {
  const pathname = usePathname();
  if (pathname?.startsWith("/resume") || PROJECT_PATHS.has(pathname ?? "")) {
    return null;
  }

  if (pathname !== "/") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] overflow-hidden print:hidden">
        <Lattice height={220} fadeAt="80%" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px] overflow-hidden print:hidden">
      <div
        className="absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)",
        }}
      >
        <HeroEmitter />
      </div>
    </div>
  );
}
