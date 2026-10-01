import { cn } from "@/lib/utils";

// The Grid floor under the hero, the film's signature image: a lattice
// of light receding to a glowing horizon, with light cycles riding it
// toward the viewer. It is positioned from its parent, whose top edge is
// the horizon (the hero puts it on the stats row, so the tiles stand on
// the horizon at every screen size), and bleeds to the window edges.
//
// Pure CSS (globals.css, "Grid floor"): a rotated plane, no canvas or JS.
// Under reduced motion the floor holds still and the cycles are hidden.

// One cycle per light. `lane` is in 64px cells from the center line;
// lanes spread out toward the viewer, so these clear the content column
// by the time the cycles are close. Each runs, then pauses before its
// next lap; the delays stagger them so one is usually on the floor.
const CYCLES = [
  { lane: -4, light: undefined, dur: "9s", delay: "0.4s" },
  { lane: 5, light: "games", dur: "8s", delay: "2.6s" },
  { lane: -6, light: "ai", dur: "10s", delay: "4.8s" },
  { lane: 4, light: "systems", dur: "9.5s", delay: "6.7s" },
] as const;

export function GridFloor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("grid-floor print:hidden", className)}>
      <div className="grid-floor-sky" />
      <div className="grid-floor-ground">
        <div className="grid-floor-plane">
          {CYCLES.map((c) => (
            <span
              key={c.lane}
              className={cn("floor-cycle", c.light && `cycle-${c.light}`)}
              style={{
                left: `calc(50% + ${c.lane * 64}px)`,
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
