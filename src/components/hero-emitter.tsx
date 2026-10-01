"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  makeSprite,
  ParticleSystem,
  type EmitterConfig,
} from "@/lib/particles";

// Homepage backdrop: one Mayhem-style emitter (src/lib/particles.ts) that
// spring-follows the cursor and wanders on a Lissajous path when idle.
// Clicking empty space fires a radial burst.
//
// Cost controls: DPR capped at 2, particle cap scales with pointer type,
// the loop stops while the canvas is offscreen or the tab is hidden, and
// reduced-motion users get a single pre-simulated still frame.

const TRAIL: EmitterConfig = {
  PatternType: "Directional",
  SpawnRate: 70,
  ParticleLife: 2.4,
  Direction: 90,
  SprayAngle: 180,
  MinSpeed: 6,
  MaxSpeed: 38,
  Gravity: -10,
  Drag: 0.9,
  Inherit: 0.18,
  Fade: "Out",
  FadeTime: 1.8,
  ScaleSetting: "Out",
  ScaleMultiplier: 1.8,
  ScaleTime: 2.4,
  Size: 1.6,
  Colors: [],
};

// Palette only; the emitter config and physics above are unchanged.
// Dark: the suits' "Natural Blue" light tape, mixed with near-white so
// the trail reads as white-hot cores with a cyan halo. Light mode is the
// "real world", so the particles are ink-blue and dimmer.
const DARK_COLORS = ["#6ee2ff", "#3fc6f0", "#bff4ff", "#e8fcff"];
const LIGHT_COLORS = ["#0e7490", "#0369a1", "#155e75"];

export function HeroEmitter({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const sprites = colors.map((c) => makeSprite(c));
    const sys = new ParticleSystem(coarse ? 160 : 420, {
      ...TRAIL,
      SpawnRate: coarse ? 28 : TRAIL.SpawnRate,
      Colors: colors,
    });

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();

    // Emitter follows a spring toward its target. Target is the pointer
    // while it's over the canvas and recently moved, else a slow
    // Lissajous figure centered on the hero.
    let t = 0;
    let px = 0;
    let py = 0;
    let lastPointer = -Infinity;
    // Narrow screens stack the hero text right under the canvas top, so
    // the idle path stays in a thin band above it.
    const idleTarget = (time: number) =>
      w < 640
        ? {
            x: w * (0.5 + 0.4 * Math.sin(time * 0.31)),
            y: h * (0.07 + 0.04 * Math.sin(time * 0.53 + 1.2)),
          }
        : {
            x: w * (0.5 + 0.4 * Math.sin(time * 0.31)),
            y: h * (0.3 + 0.18 * Math.sin(time * 0.53 + 1.2)),
          };
    const start = idleTarget(0);
    sys.ex = start.x;
    sys.ey = start.y;

    const step = (dt: number) => {
      t += dt;
      const usePointer = !coarse && t - lastPointer < 2.5;
      const target = usePointer ? { x: px, y: py } : idleTarget(t);
      const k = usePointer ? 60 : 8;
      const damp = usePointer ? 0.8 : 0.9;
      sys.evx += (target.x - sys.ex) * k * dt;
      sys.evy += (target.y - sys.ey) * k * dt;
      sys.evx *= Math.pow(1 - damp, dt * 4);
      sys.evy *= Math.pow(1 - damp, dt * 4);
      sys.ex += sys.evx * dt;
      sys.ey += sys.evy * dt;
      sys.update(dt);
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";
      // Dim while the emitter is behind the text column (max-w-2xl) so the
      // glow never fights the copy for contrast.
      const fromCenter = Math.abs(sys.ex - w / 2);
      const columnDim = w < 640 ? 0.8 : Math.min(1, Math.max(0.45, (fromCenter - 200) / 260 + 0.45));
      sys.draw(ctx, sprites, dpr, (isDark ? 0.85 : 0.55) * columnDim);
      ctx.globalCompositeOperation = "source-over";
    };

    if (reduceMotion) {
      // Pre-simulate a few seconds so the still frame shows a trail.
      for (let i = 0; i < 240; i++) step(1 / 60);
      render();
      const ro = new ResizeObserver(() => {
        resize();
        render();
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = 0;
    let visible = true;
    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      step(dt);
      render();
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // The canvas is pointer-events:none so it never blocks the hero's
    // links; listen on window and map into canvas space instead.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      px = x;
      py = y;
      lastPointer = t;
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, [role=button]")) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      sys.burst(coarse ? 40 : 90, x, y, 40, 220);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    play();

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [reduceMotion, isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  );
}
