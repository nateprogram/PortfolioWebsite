"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

// The canvas band behind the top of every page. The homepage gets the
// particle emitter on top of the grid; /resume gets nothing so it reads
// (and prints) like a document.

const HeroEmitter = dynamic(
  () => import("@/components/hero-emitter").then((m) => m.HeroEmitter),
  { ssr: false }
);

const fade = {
  maskImage: "linear-gradient(to bottom, black, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
};

export function TopBackdrop() {
  const pathname = usePathname();
  if (pathname?.startsWith("/resume")) return null;

  const grid = (
    <div className="absolute inset-x-0 top-0 h-[100px] overflow-hidden">
      <FlickeringGrid
        className="h-full w-full"
        squareSize={2}
        gridGap={2}
        style={fade}
      />
    </div>
  );

  if (pathname !== "/") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100px] print:hidden">
        {grid}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px] overflow-hidden print:hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,var(--brand-soft),transparent_70%)]"
        aria-hidden
      />
      {grid}
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
