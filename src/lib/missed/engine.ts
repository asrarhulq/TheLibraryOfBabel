// Motion engine for "The Thing You Missed". Pure and deterministic: the same seed produces the same
// motion and the same bounce count in every browser and on the server.
//
// Determinism notes: fixed timestep (1/60 s), IEEE-754 + − × ÷ and Math.sqrt only (all correctly
// rounded, so identical everywhere). No trig is used for anything that affects the count. Relative
// imports only, so `node` can run this file directly for the verification script.

export const FPS = 60;
export const DT = 1 / FPS;
export const RADIUS = 0.032; // circle radius (arena is the unit square)
export const STAR_R = RADIUS * 3; // star is 3× the circles' size
/** Minimum share of speed along each axis (≈ at least 20° away from any wall). */
const MIN_COMPONENT = 0.34;
/** Wall contacts by the same circle within this many frames (0.2 s) are one bounce. */
export const CORNER_FRAMES = 12;

export type RoundKind = "practice" | "critical";
export type Difficulty = "easy" | "medium" | "hard";

export interface SceneConfig {
  whites: number;
  darks: number;
  speed: number; // arena widths per second
  wander: number; // random steering strength
  duration: number; // seconds
  star: { enter: number; cross: number } | null; // seconds
  countRange: [number, number]; // accepted white-bounce totals (keeps rounds countable)
}

const BASE: Record<RoundKind, SceneConfig> = {
  practice: { whites: 4, darks: 4, speed: 0.07, wander: 0.35, duration: 25, star: null, countRange: [6, 10] },
  critical: { whites: 4, darks: 4, speed: 0.13, wander: 0.5, duration: 25, star: { enter: 12, cross: 7 }, countRange: [14, 20] },
};

/** Reduced-motion variant: slower shapes, so fewer bounces (ranges scaled to match). */
export function configFor(kind: RoundKind, reduced: boolean): SceneConfig {
  const c = BASE[kind];
  if (!reduced) return c;
  return {
    ...c,
    speed: c.speed * 0.6,
    wander: c.wander * 0.6,
    countRange: kind === "practice" ? [4, 8] : [9, 14],
  };
}

export const SANDBOX: Record<Difficulty, { whites: number; darks: number; speed: number; wander: number }> = {
  easy: { whites: 3, darks: 3, speed: 0.08, wander: 0.3 },
  medium: { whites: 4, darks: 4, speed: 0.14, wander: 0.45 },
  hard: { whites: 6, darks: 6, speed: 0.22, wander: 0.6 },
};

// ── PRNG: cyrb128 → sfc32 ──────────────────────────────────────────────────

function hash(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

export function rngFrom(seed: string): () => number {
  let [a, b, c, d] = hash(seed);
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}

// ── Live simulation (used for precomputed rounds and the looping sandbox) ───

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number; // cruise speed
  white: boolean;
  lastHit: number; // frame of the last counted bounce
}

export class Sim {
  bodies: Body[];
  bounces = 0; // white wall-bounces so far
  frame = 0;
  /** True once a white circle touches walls twice in an ambiguous gap (2–39 frames). */
  ambiguous = false;
  speed: number;
  wander: number;
  private rand: () => number;
  constructor(rand: () => number, whites: number, darks: number, speed: number, wander: number) {
    this.rand = rand;
    this.speed = speed;
    this.wander = wander;
    this.bodies = [];
    for (let i = 0; i < whites + darks; i++) this.bodies.push(this.spawn(i < whites));
  }

  private spawn(white: boolean): Body {
    const r = this.rand;
    const m = RADIUS + 0.06;
    const x = m + r() * (1 - 2 * m);
    const y = m + r() * (1 - 2 * m);
    let vx = 0,
      vy = 0,
      len = 0;
    while (len < 0.4) {
      vx = r() * 2 - 1;
      vy = r() * 2 - 1;
      len = Math.sqrt(vx * vx + vy * vy);
    }
    const s = this.speed * (0.85 + 0.3 * r());
    return { x, y, vx: (vx / len) * s, vy: (vy / len) * s, s, white, lastHit: -999 };
  }

  /** Advance one fixed step. Returns how many WHITE circles bounced this frame. */
  step(): number {
    const r = this.rand;
    let hits = 0;
    this.frame++;
    for (const b of this.bodies) {
      // gentle random steering, then hold cruise speed
      b.vx += (r() - 0.5) * this.wander * DT;
      b.vy += (r() - 0.5) * this.wander * DT;
      let len = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
      b.vx = (b.vx / len) * b.s;
      b.vy = (b.vy / len) * b.s;
      // never travel nearly parallel to a wall: keeps every bounce a clear, countable reversal
      const minC = MIN_COMPONENT * b.s;
      if (Math.abs(b.vx) < minC || Math.abs(b.vy) < minC) {
        if (Math.abs(b.vx) < minC) b.vx = b.vx < 0 ? -minC : minC;
        if (Math.abs(b.vy) < minC) b.vy = b.vy < 0 ? -minC : minC;
        len = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.vx = (b.vx / len) * b.s;
        b.vy = (b.vy / len) * b.s;
      }
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      let hit = false;
      if (b.x < RADIUS) {
        b.x = 2 * RADIUS - b.x;
        b.vx = Math.abs(b.vx);
        hit = true;
      } else if (b.x > 1 - RADIUS) {
        b.x = 2 * (1 - RADIUS) - b.x;
        b.vx = -Math.abs(b.vx);
        hit = true;
      }
      if (b.y < RADIUS) {
        b.y = 2 * RADIUS - b.y;
        b.vy = Math.abs(b.vy);
        hit = true;
      } else if (b.y > 1 - RADIUS) {
        b.y = 2 * (1 - RADIUS) - b.y;
        b.vy = -Math.abs(b.vy);
        hit = true;
      }
      // a corner (two walls within 0.2 s) reads as one bounce, so it counts as one
      if (hit && b.white) {
        const gap = this.frame - b.lastHit;
        if (gap > 1 && gap < 40) this.ambiguous = true;
        if (gap > CORNER_FRAMES) hits++;
      }
      if (hit) b.lastHit = this.frame;
    }
    this.bounces += hits;
    return hits;
  }
}

// ── Precomputed rounds ─────────────────────────────────────────────────────

export interface StarPath {
  dir: 1 | -1;
  y0: number;
  enter: number;
  cross: number;
  /** Seconds during which at least half the star is inside the arena. */
  visibleSeconds: number;
}

export interface Scene {
  kind: RoundKind;
  config: SceneConfig;
  n: number;
  white: boolean[];
  frames: number;
  /** x,y per body per frame: positions[(f * n + i) * 2] */
  positions: Float32Array;
  bounceCount: number;
  bounceFrames: number[];
  star: StarPath | null;
  attempt: number;
}

export function buildScene(seed: string, kind: RoundKind, reduced: boolean): Scene {
  const config = configFor(kind, reduced);
  let last: Scene | null = null;
  for (let attempt = 0; attempt < 64; attempt++) {
    const rand = rngFrom(`${seed}|${kind}|${reduced ? "rm" : "std"}|${attempt}`);
    const starDir: 1 | -1 = rand() < 0.5 ? 1 : -1;
    const starY = 0.5 + (rand() - 0.5) * 0.08;
    const sim = new Sim(rand, config.whites, config.darks, config.speed, config.wander);
    const n = sim.bodies.length;
    const frames = Math.round(config.duration * FPS);
    const positions = new Float32Array(frames * n * 2);
    const bounceFrames: number[] = [];
    for (let f = 0; f < frames; f++) {
      if (f > 0) {
        const hits = sim.step();
        for (let k = 0; k < hits; k++) bounceFrames.push(f);
      }
      for (let i = 0; i < n; i++) {
        positions[(f * n + i) * 2] = sim.bodies[i].x;
        positions[(f * n + i) * 2 + 1] = sim.bodies[i].y;
      }
    }
    const star: StarPath | null = config.star
      ? {
          dir: starDir,
          y0: starY,
          enter: config.star.enter,
          cross: config.star.cross,
          visibleSeconds: config.star.cross / (1 + 2 * STAR_R),
        }
      : null;
    last = {
      kind,
      config,
      n,
      white: sim.bodies.map((b) => b.white),
      frames,
      positions,
      bounceCount: sim.bounces,
      bounceFrames,
      star,
      attempt,
    };
    // keep it countable: total in range, no white bounce in the final half-second, and no
    // near-corner double contacts that a person couldn't call one bounce or two
    const endClear = bounceFrames.every((f) => f < frames - 30);
    if (sim.bounces >= config.countRange[0] && sim.bounces <= config.countRange[1] && endClear && !sim.ambiguous) return last;
  }
  return last!;
}

/** Star centre/rotation at time t (seconds); null when off-screen. Rendering only. */
export function starAt(star: StarPath, t: number): { x: number; y: number; rot: number } | null {
  const k = (t - star.enter) / star.cross;
  if (k < 0 || k > 1) return null;
  const x = star.dir === 1 ? -STAR_R + (1 + 2 * STAR_R) * k : 1 + STAR_R - (1 + 2 * STAR_R) * k;
  return { x, y: star.y0 + Math.sin(k * Math.PI * 2) * 0.012, rot: k * 2.2 * star.dir };
}

/** The "what was it?" options, shuffled per seed. */
export const CHOICES = [
  { id: "star", label: "A magenta star" },
  { id: "triangle", label: "A green triangle" },
  { id: "square", label: "A white square" },
  { id: "ring", label: "A circle that changed colour" },
] as const;
export type ChoiceId = (typeof CHOICES)[number]["id"];

export function choicesFor(seed: string) {
  const r = rngFrom(`${seed}|choices`);
  const a = [...CHOICES];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const SEED_RE = /^[a-z0-9]{8}$/;
