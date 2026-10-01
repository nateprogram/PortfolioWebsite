"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DATA, projectLightClass } from "@/data";
import { cn } from "@/lib/utils";

// Project pages take their category's light (see src/data/lights.ts).
const PATH_LIGHT = new Map(
  DATA.projects.map((p) => [p.href, projectLightClass(p)] as const)
);

// The band behind the top of every page. Inner pages get a faint square
// lattice of light. The homepage gets the sky above the Grid floor (the
// floor itself is part of the hero, see grid-floor.tsx, so its horizon
// can sit on the stats row at every screen size) plus the particle
// emitter. /resume gets nothing so it reads (and prints) like a document.
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
  if (pathname?.startsWith("/resume")) return null;

  if (pathname !== "/") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] overflow-hidden print:hidden",
          PATH_LIGHT.get(pathname ?? "")
        )}
      >
        <Lattice height={220} fadeAt="80%" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px] overflow-hidden print:hidden">
      {/* The sky: dark, with only a faint far lattice, so the floor and
          its horizon carry the scene. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 20%, transparent 75%)",
        }}
        aria-hidden
      >
        <div className="absolute inset-0 tron-lattice" />
      </div>
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
