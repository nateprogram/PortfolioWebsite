// A TypeScript port of the Mayhem Engine emitter model (see
// /projects/mayhem-engine). Same field names as the engine's Emitter.json,
// same update loop shape: accumulator-driven spawn, age + integrate,
// evaluate fade and scale curves against age, recycle expired slots.
//
// Differences from the C++ version, all web-only additions:
//   Direction    degrees for the Directional pattern (90 = up)
//   Gravity      px/s^2, positive pulls down
//   Drag         fraction of velocity lost per second
//   Inherit      fraction of the emitter's velocity new particles keep
//   Size         base radius in CSS px
//   Colors       hex colors, one picked per particle
//
// The pool is struct-of-arrays in typed arrays and sized once, so the
// frame loop never allocates.

export type FadeMode = "Out" | "In" | "None";
export type ScaleSetting = "In" | "Out" | "Pop" | "None";
export type PatternType = "Directional" | "Rotate";

export type EmitterConfig = {
  PatternType: PatternType;
  SpawnRate: number;
  ParticleLife: number;
  Direction: number;
  SprayAngle: number;
  MinSpeed: number;
  MaxSpeed: number;
  Gravity: number;
  Drag: number;
  Inherit: number;
  Fade: FadeMode;
  FadeTime: number;
  ScaleSetting: ScaleSetting;
  ScaleMultiplier: number;
  ScaleTime: number;
  Size: number;
  Colors: string[];
};

export const DEFAULT_EMITTER: EmitterConfig = {
  PatternType: "Directional",
  SpawnRate: 120,
  ParticleLife: 1.6,
  Direction: 90,
  SprayAngle: 20,
  MinSpeed: 80,
  MaxSpeed: 220,
  Gravity: 160,
  Drag: 0.2,
  Inherit: 0,
  Fade: "Out",
  FadeTime: 0.6,
  ScaleSetting: "Pop",
  ScaleMultiplier: 2,
  ScaleTime: 1.2,
  Size: 2,
  Colors: ["#38bdf8", "#818cf8", "#f0abfc"],
};

export function evalFade(
  mode: FadeMode,
  age: number,
  life: number,
  fadeTime: number
) {
  if (fadeTime <= 0) return 1;
  if (mode === "Out") return age > life - fadeTime ? (life - age) / fadeTime : 1;
  if (mode === "In") return age < fadeTime ? age / fadeTime : 1;
  return 1;
}

export function evalScale(
  setting: ScaleSetting,
  age: number,
  mult: number,
  time: number
) {
  if (time <= 0) return 1;
  const t = Math.min(age / time, 1);
  if (setting === "In") return 1 + (mult - 1) * t;
  if (setting === "Out") return mult - (mult - 1) * t;
  if (setting === "Pop") {
    // Up to ScaleMultiplier by the midpoint, back to 1 by ScaleTime.
    return t < 0.5 ? 1 + (mult - 1) * t * 2 : mult - (mult - 1) * (t - 0.5) * 2;
  }
  return 1;
}

const DEG = Math.PI / 180;

export class ParticleSystem {
  readonly cap: number;
  count = 0;
  /** Spawns refused because the system was full. Callers reset it. */
  dropped = 0;
  config: EmitterConfig;
  /** Emitter position in CSS px. */
  ex = 0;
  ey = 0;
  /** Emitter velocity in px/s, fed to Inherit. */
  evx = 0;
  evy = 0;

  private x: Float32Array;
  private y: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private age: Float32Array;
  private life: Float32Array;
  private size: Float32Array;
  private color: Uint8Array;
  private spawnAcc = 0;
  private sweep = 0;

  constructor(cap: number, config: EmitterConfig) {
    this.cap = cap;
    this.config = config;
    this.x = new Float32Array(cap);
    this.y = new Float32Array(cap);
    this.vx = new Float32Array(cap);
    this.vy = new Float32Array(cap);
    this.age = new Float32Array(cap);
    this.life = new Float32Array(cap);
    this.size = new Float32Array(cap);
    this.color = new Uint8Array(cap);
  }

  clear() {
    this.count = 0;
    this.spawnAcc = 0;
  }

  private spawn(x: number, y: number, angle: number, speed: number, life: number) {
    if (this.count >= this.cap) {
      this.dropped++;
      return;
    }
    const i = this.count++;
    const c = this.config;
    this.x[i] = x;
    this.y[i] = y;
    // Screen y grows downward, so "up" (90deg) is negative y.
    this.vx[i] = Math.cos(angle) * speed + this.evx * c.Inherit;
    this.vy[i] = -Math.sin(angle) * speed + this.evy * c.Inherit;
    this.age[i] = 0;
    this.life[i] = life;
    this.size[i] = c.Size * (0.6 + Math.random() * 0.8);
    this.color[i] = Math.floor(Math.random() * Math.max(1, c.Colors.length));
  }

  private launchAngle() {
    const c = this.config;
    const base =
      c.PatternType === "Rotate" ? this.sweep : c.Direction * DEG;
    return base + (Math.random() * 2 - 1) * c.SprayAngle * DEG;
  }

  /** Radial one-shot, used for click bursts. */
  burst(n: number, x: number, y: number, minSpeed: number, maxSpeed: number) {
    const c = this.config;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = minSpeed + Math.random() * (maxSpeed - minSpeed);
      this.spawn(x, y, a, s, c.ParticleLife * (0.6 + Math.random() * 0.6));
    }
  }

  update(dt: number, emitting = true) {
    const c = this.config;
    if (emitting && c.SpawnRate > 0) {
      this.spawnAcc += c.SpawnRate * dt;
      if (c.PatternType === "Rotate") this.sweep += dt * 4;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        const speed = c.MinSpeed + Math.random() * (c.MaxSpeed - c.MinSpeed);
        this.spawn(this.ex, this.ey, this.launchAngle(), speed, c.ParticleLife);
      }
    }

    const drag = Math.max(0, 1 - c.Drag * dt);
    const g = c.Gravity * dt;
    let i = 0;
    while (i < this.count) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        // Recycle: swap the last live particle into this slot.
        const last = --this.count;
        this.x[i] = this.x[last];
        this.y[i] = this.y[last];
        this.vx[i] = this.vx[last];
        this.vy[i] = this.vy[last];
        this.age[i] = this.age[last];
        this.life[i] = this.life[last];
        this.size[i] = this.size[last];
        this.color[i] = this.color[last];
        continue;
      }
      this.vy[i] += g;
      this.vx[i] *= drag;
      this.vy[i] *= drag;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      i++;
    }
  }

  /**
   * Draw every live particle as a pre-rendered glow sprite.
   * `sprites[k]` must match `config.Colors[k]`.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    sprites: ReadonlyArray<HTMLCanvasElement>,
    dpr: number,
    alphaScale = 1
  ) {
    const c = this.config;
    for (let i = 0; i < this.count; i++) {
      const a =
        evalFade(c.Fade, this.age[i], this.life[i], c.FadeTime) * alphaScale;
      if (a <= 0.01) continue;
      const s =
        this.size[i] *
        evalScale(c.ScaleSetting, this.age[i], c.ScaleMultiplier, c.ScaleTime);
      // Sprite glow extends ~4x the core radius.
      const r = s * 4 * dpr;
      const sprite = sprites[this.color[i] % sprites.length];
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(sprite, this.x[i] * dpr - r, this.y[i] * dpr - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
}

/** A soft radial glow with a bright core, cached per color. */
export function makeSprite(hex: string, size = 64): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const h = size / 2;
  const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
  // Small white-hot core, then the color falling off. Kept soft so dense
  // clouds under additive blending don't saturate straight to white.
  grad.addColorStop(0, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.1, withAlpha(hex, 0.9));
  grad.addColorStop(0.32, withAlpha(hex, 0.28));
  grad.addColorStop(1, withAlpha(hex, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function withAlpha(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function hexToRgb(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Parse user-edited JSON into a config. Accepts either the bare object or
 * the engine's `{ "Emitter": { ... } }` wrapper. Unknown keys are ignored,
 * missing keys fall back to `base`. Throws with a readable message on
 * anything the renderer can't use.
 */
export function parseEmitterJson(text: string, base: EmitterConfig): EmitterConfig {
  const raw = JSON.parse(text);
  const obj = raw && typeof raw === "object" && "Emitter" in raw ? raw.Emitter : raw;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("Expected a JSON object of emitter fields.");
  }
  const out: EmitterConfig = { ...base, Colors: [...base.Colors] };
  const num = (k: keyof EmitterConfig, min: number, max: number) => {
    if (!(k in obj)) return;
    const v = obj[k];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`${k} must be a number.`);
    }
    (out[k] as number) = Math.min(max, Math.max(min, v));
  };
  const oneOf = <T extends string>(k: keyof EmitterConfig, values: readonly T[]) => {
    if (!(k in obj)) return;
    if (!values.includes(obj[k])) {
      throw new Error(`${k} must be one of: ${values.join(", ")}.`);
    }
    (out[k] as string) = obj[k];
  };
  oneOf("PatternType", ["Directional", "Rotate"] as const);
  num("SpawnRate", 0, 600);
  num("ParticleLife", 0.05, 10);
  num("Direction", -360, 360);
  num("SprayAngle", 0, 180);
  num("MinSpeed", 0, 2000);
  num("MaxSpeed", 0, 2000);
  num("Gravity", -2000, 2000);
  num("Drag", 0, 10);
  num("Inherit", 0, 1);
  oneOf("Fade", ["Out", "In", "None"] as const);
  num("FadeTime", 0, 10);
  oneOf("ScaleSetting", ["In", "Out", "Pop", "None"] as const);
  num("ScaleMultiplier", 0, 10);
  num("ScaleTime", 0, 10);
  num("Size", 0.5, 20);
  if ("Colors" in obj) {
    const cs = obj.Colors;
    if (!Array.isArray(cs) || cs.length === 0 || !cs.every((c) => typeof c === "string" && HEX_RE.test(c))) {
      throw new Error('Colors must be a non-empty array of hex strings like "#38bdf8".');
    }
    out.Colors = cs.slice(0, 8);
  }
  if (out.MaxSpeed < out.MinSpeed) out.MaxSpeed = out.MinSpeed;
  return out;
}
