import { cn } from "@/lib/utils";

// The Grid floor, the film's signature image: a lattice of light in
// perspective, with light cycles riding it toward the viewer. It fills
// its box as one continuous background, and the horizon runs along the
// very top of the box (the top of the page) with a glow above it, so it
// frames the page instead of splitting the section. It bleeds to the
// window edges; the caller sets the box with top/bottom or height
// classes.
//
// The lattice takes --floor-paint when set (a project page in several
// categories, see projectLightStyle), else the plain --brand light.
//
// Pure CSS (globals.css, "Grid floor"): a rotated plane, no canvas or JS.
// Under reduced motion the floor holds still and the cycles are hidden.

// Light-cycle matches, as in the film: on each lane a cycle is chased by
// one from the other side, a beat behind at the same speed (orange
// chasing blue, gold chasing white). `lane` counts grid lines from the
// center; the plane's lines sit at center - 24px + n * 48px (its 48px
// mask tiles are centered), so cycles ride those lines, not the gaps
// between them. Lanes spread toward the viewer, so these run beside the
// content column.
const CYCLES = [
  { lane: -5, light: undefined, dur: "9s", delay: "0.2s" },
  { lane: -5, light: "games", dur: "9s", delay: "0.75s" },
  { lane: 6, light: "ai", dur: "9.5s", delay: "4.2s" },
  { lane: 6, light: "systems", dur: "9.5s", delay: "4.75s" },
] as const;

export function GridFloor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("grid-floor print:hidden", className)}>
      <div className="grid-floor-sky" />
      <div className="grid-floor-ground">
        <div className="grid-floor-plane" />
        <div className="grid-floor-cycles">
          {CYCLES.map((c) => (
            <span
              key={`${c.lane}-${c.delay}`}
              className={cn("floor-cycle", c.light && `cycle-${c.light}`)}
              style={{
                left: `calc(50% - 24px + ${c.lane * 48}px)`,
                ["--dur" as string]: c.dur,
                ["--delay" as string]: c.delay,
              }}
            />
          ))}
        </div>
      </div>
      <div className="grid-floor-horizon" />
    </div>
  );
}
