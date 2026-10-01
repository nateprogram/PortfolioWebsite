"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// The band behind the top of every page: the Grid floor (a faint square
// lattice of light) with a few light ribbons running along its lines.
// The homepage adds the particle emitter on top. /resume gets nothing so
// it reads (and prints) like a document.
//
// Everything here except the emitter is CSS: no canvas, no JS loop.

const HeroEmitter = dynamic(
  () => import("@/components/hero-emitter").then((m) => m.HeroEmitter),
  { ssr: false }
);

// Lattice cells are 48px, so ribbon offsets are multiples of 48. Paths
// stay in the top row and the side margins so a ribbon never runs along
// the edge of a piece of content and reads as a glitch.
const RIBBONS_X = [
  { top: 48, dur: "11s", delay: "0s" },
  { top: 48, dur: "15s", delay: "6s" },
];
const RIBBONS_Y = [
  { left: 96, dur: "9s", delay: "2s" },
  { left: 1200, dur: "10s", delay: "4.5s" },
  { left: 1344, dur: "13s", delay: "8s" },
];

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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] overflow-hidden print:hidden">
        <Lattice height={220} fadeAt="80%" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px] overflow-hidden print:hidden">
      {/* Under-light: the Grid is lit from below, so the haze is
          brightest near the floor line, not in the sky. */}
      <div
        className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,var(--brand-soft),transparent_70%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 80% 90% at 50% 0%, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 90% at 50% 0%, black 30%, transparent 78%)",
        }}
        aria-hidden
      >
        <div className="absolute inset-0 tron-lattice" />
        {RIBBONS_X.map((r) => (
          <span
            key={`x${r.top}`}
            className="ribbon ribbon-x"
            style={{ top: r.top - 1, ["--dur" as string]: r.dur, ["--delay" as string]: r.delay }}
          />
        ))}
        {RIBBONS_Y.map((r) => (
          <span
            key={`y${r.left}`}
            className="ribbon ribbon-y"
            style={{ left: r.left - 1, ["--dur" as string]: r.dur, ["--delay" as string]: r.delay }}
          />
        ))}
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
