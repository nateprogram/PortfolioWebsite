"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_EMITTER,
  makeSprite,
  parseEmitterJson,
  ParticleSystem,
  type EmitterConfig,
} from "@/lib/particles";

// Live, editable version of the Mayhem Engine emitter. Same idea as the
// engine's workflow: edit the JSON, the emitter hot-reloads, and a bad
// edit keeps the last good config running instead of crashing. Drag on
// the canvas to move the emitter; click to fire a burst.

type Preset = { name: string; config: Partial<EmitterConfig> };

const PRESETS: Preset[] = [
  {
    name: "Fountain",
    config: {},
  },
  {
    name: "Muzzle flash",
    config: {
      PatternType: "Rotate",
      SpawnRate: 260,
      ParticleLife: 0.5,
      SprayAngle: 12,
      MinSpeed: 220,
      MaxSpeed: 420,
      Gravity: 0,
      Drag: 2,
      Fade: "Out",
      FadeTime: 0.3,
      ScaleSetting: "Pop",
      ScaleMultiplier: 3,
      ScaleTime: 0.4,
      Size: 2.5,
      Colors: ["#fde68a", "#fb923c", "#f87171"],
    },
  },
  {
    name: "Thruster",
    config: {
      PatternType: "Directional",
      SpawnRate: 220,
      ParticleLife: 0.9,
      Direction: 180,
      SprayAngle: 8,
      MinSpeed: 180,
      MaxSpeed: 320,
      Gravity: 0,
      Drag: 1.2,
      Inherit: 0.5,
      Fade: "Out",
      FadeTime: 0.7,
      ScaleSetting: "Out",
      ScaleMultiplier: 2.5,
      ScaleTime: 0.9,
      Size: 3,
      Colors: ["#e0f2fe", "#38bdf8", "#6366f1"],
    },
  },
  {
    name: "Snow",
    config: {
      PatternType: "Directional",
      SpawnRate: 60,
      ParticleLife: 5,
      Direction: -90,
      SprayAngle: 60,
      MinSpeed: 10,
      MaxSpeed: 40,
      Gravity: 12,
      Drag: 0.4,
      Fade: "In",
      FadeTime: 0.8,
      ScaleSetting: "None",
      ScaleMultiplier: 1,
      ScaleTime: 1,
      Size: 2,
      Colors: ["#f8fafc", "#cbd5e1"],
    },
  },
];

// Fields shown in the editor, in engine order. Anything else in the
// config keeps its default.
const EDITOR_KEYS: (keyof EmitterConfig)[] = [
  "PatternType",
  "SpawnRate",
  "ParticleLife",
  "Direction",
  "SprayAngle",
  "MinSpeed",
  "MaxSpeed",
  "Gravity",
  "Drag",
  "Fade",
  "FadeTime",
  "ScaleSetting",
  "ScaleMultiplier",
  "ScaleTime",
  "Size",
  "Colors",
];

function toJson(config: EmitterConfig) {
  const picked: Record<string, unknown> = {};
  for (const k of EDITOR_KEYS) picked[k] = config[k];
  // One field per line, colors array kept on one line.
  const body = Object.entries(picked)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v).replace(/,/g, ", ")}`)
    .join(",\n");
  return `{\n  "Emitter": {\n${body}\n  }\n}`;
}

const presetConfig = (p: Preset): EmitterConfig => ({ ...DEFAULT_EMITTER, ...p.config });

export function ParticlePlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  // Shown while the system is at its particle cap (see the frame loop).
  const capRef = useRef<HTMLDivElement>(null);
  const sysRef = useRef<ParticleSystem | null>(null);
  const spritesRef = useRef<HTMLCanvasElement[]>([]);
  const reduceMotion = usePrefersReducedMotion();

  const [text, setText] = useState(() => toJson(presetConfig(PRESETS[0])));
  const [error, setError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].name);
  // null = follow the reduced-motion preference until the user chooses.
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !reduceMotion;
  const playingRef = useRef(playing);
  const loopRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const apply = (config: EmitterConfig) => {
    const sys = sysRef.current;
    if (!sys) return;
    const colorsChanged =
      config.Colors.join() !== sys.config.Colors.join() ||
      spritesRef.current.length === 0;
    sys.config = config;
    if (colorsChanged) spritesRef.current = config.Colors.map((c) => makeSprite(c));
  };

  const onEdit = (value: string) => {
    setText(value);
    setActivePreset(null);
    try {
      const config = parseEmitterJson(value, DEFAULT_EMITTER);
      apply(config);
      setError(null);
      setReloads((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const loadPreset = (p: Preset) => {
    const config = presetConfig(p);
    setText(toJson(config));
    setActivePreset(p.name);
    setError(null);
    apply(config);
    sysRef.current?.clear();
    setReloads((n) => n + 1);
  };

  // Simulation + render loop. Owns the ParticleSystem for its lifetime.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Starts on the first preset, which is what the editor shows.
    const sys = new ParticleSystem(1500, presetConfig(PRESETS[0]));
    sysRef.current = sys;
    spritesRef.current = sys.config.Colors.map((c) => makeSprite(c));

    let w = 0;
    let h = 0;
    let dpr = 1;
    let anchored = false;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!anchored) {
        sys.ex = w / 2;
        sys.ey = h * 0.72;
        anchored = true;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      sys.draw(ctx, spritesRef.current, dpr, 0.75);
      ctx.globalCompositeOperation = "source-over";
      // Emitter origin marker.
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.arc(sys.ex * dpr, sys.ey * dpr, 6 * dpr, 0, Math.PI * 2);
      ctx.stroke();
    };

    // Seed a frame so the paused state isn't an empty box.
    for (let i = 0; i < 90; i++) sys.update(1 / 60);
    render();

    let raf = 0;
    let last = 0;
    let visible = true;
    let lastCount = 0;
    // The cap message: on while the system is refusing new particles
    // because it's full, off 2.5s after the last refusal, so it doesn't
    // flicker at the edge. Written straight to the DOM, like the live
    // count, so it never re-renders the component.
    let capShownAt = 0;
    const capText = `Limit reached: ${sys.cap.toLocaleString("en-US")} particles. New ones spawn as old ones fade.`;
    const updateCap = (now: number) => {
      const el = capRef.current;
      if (!el) return;
      if (sys.dropped > 0) {
        sys.dropped = 0;
        if (!capShownAt) {
          el.textContent = capText;
          el.dataset.on = "true";
        }
        capShownAt = now;
      } else if (capShownAt && now - capShownAt > 2500) {
        capShownAt = 0;
        el.textContent = "";
        el.dataset.on = "false";
      }
    };
    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      sys.update(dt);
      render();
      if (now - lastCount > 200 && countRef.current) {
        countRef.current.textContent = String(sys.count);
        updateCap(now);
        lastCount = now;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || document.hidden || !playingRef.current) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // Lets the play/pause effect below drive the loop without
    // re-creating the system.
    loopRef.current = { start, stop };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Drag to move the emitter; a click without drag fires a burst.
    let dragging = false;
    let moved = false;
    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const p = local(e);
      sys.evx = (p.x - sys.ex) * 30;
      sys.evy = (p.y - sys.ey) * 30;
      sys.ex = p.x;
      sys.ey = p.y;
      moved = true;
      if (!raf) render();
    };
    const onUp = (e: PointerEvent) => {
      if (dragging && !moved) {
        const p = local(e);
        sys.burst(120, p.x, p.y, 60, 320);
        if (!raf) render();
      }
      dragging = false;
      sys.evx = 0;
      sys.evy = 0;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      sysRef.current = null;
      loopRef.current = null;
    };
  }, []);

  // Play / pause without tearing down the simulation.
  useEffect(() => {
    playingRef.current = playing;
    if (playing) loopRef.current?.start();
    else loopRef.current?.stop();
  }, [playing]);

  return (
    <div id="playground" className="flex flex-col gap-3 scroll-mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Emitter presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              aria-pressed={activePreset === p.name}
              onClick={() => loadPreset(p)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-[11px] font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activePreset === p.name
                  ? "border-brand/60 bg-brand-soft text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUserPlaying(!playing)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {playing ? <Pause className="size-3" aria-hidden /> : <Play className="size-3" aria-hidden />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => sysRef.current?.clear()}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3" aria-hidden />
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-lg border border-border bg-zinc-950">
          <canvas
            ref={canvasRef}
            aria-label="Particle emitter preview. Drag to move the emitter, click to fire a burst."
            role="img"
            className="block aspect-[4/3] w-full cursor-crosshair touch-none"
          />
          <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
            live: <span ref={countRef}>0</span>
          </div>
          {/* Pops up while the system is at its particle cap. */}
          <div
            ref={capRef}
            role="status"
            data-on="false"
            className="pointer-events-none absolute right-2 top-2 max-w-[60%] rounded border border-brand/60 bg-black/75 px-2 py-1 text-right font-mono text-[10px] leading-snug text-brand shadow-[0_0_10px_0_var(--brand-glow)] transition-opacity duration-300 data-[on=false]:opacity-0 data-[on=true]:opacity-100"
          />
          <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] text-zinc-400">
            drag to move · click to burst
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="emitter-json" className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Emitter.json
            <span
              key={reloads}
              className={cn(
                "normal-case tracking-normal",
                error ? "text-destructive" : "text-brand motion-safe:animate-in fade-in"
              )}
              aria-live="polite"
            >
              {error ? "kept last good config" : reloads > 0 ? "hot-reloaded ✓" : "edit me"}
            </span>
          </label>
          <textarea
            id="emitter-json"
            value={text}
            onChange={(e) => onEdit(e.target.value)}
            spellCheck={false}
            className={cn(
              "min-h-[260px] flex-1 resize-y rounded-lg border bg-muted/30 p-3 font-mono text-[11.5px] leading-relaxed text-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              error ? "border-destructive/60" : "border-border"
            )}
          />
          {error && (
            <p className="font-mono text-[11px] text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
