// Procedural Bauhaus-style pieces for "You Said That?". Original abstract art from a seed: no photos,
// no copyrighted images. Each pair shares a palette and most of its composition (so the two are
// comparable) but differs in 3–4 visible features, at least 2 of them not about colour and at least
// one of them large (the main shape's form or place, or the bars' direction), so a swap is fair to spot.

import { int, pick, rngFor, shuffle, type Rng } from "./rng";

export const W = 100;
export const H = 125;

type Corner = 0 | 1 | 2 | 3; // top-left, top-right, bottom-left, bottom-right

export interface Features {
  palette: number; // shared by both pieces in a pair
  ground: 0 | 1; // light / dark background
  colors: number; // which of the 3 inks goes on sun / bars / arc (0–5)
  sunKind: 0 | 1 | 2; // disc, ring, half-disc
  sunPos: Corner;
  barCount: 2 | 3 | 4;
  barDir: 0 | 1; // vertical / horizontal
  arcCorner: Corner;
  accent: 0 | 1 | 2; // dot grid, triangle, square
  diagonal: 0 | 1; // rising / falling
}

export type FeatureKey = Exclude<keyof Features, "palette">;

/** Which features are about colour only (the rest are about form, number or place). */
export const COLOR_FEATURES: readonly FeatureKey[] = ["ground", "colors"];
const BIG_FEATURES: readonly FeatureKey[] = ["sunKind", "sunPos", "barDir"];
const ALL_FEATURES: readonly FeatureKey[] = ["ground", "colors", "sunKind", "sunPos", "barCount", "barDir", "arcCorner", "accent", "diagonal"];

interface Palette {
  name: string;
  light: [string, string];
  dark: [string, string];
  inks: [[string, string], [string, string], [string, string]]; // [hex, name]
}

export const PALETTES: readonly Palette[] = [
  { name: "Primary", light: ["#efe6d2", "cream"], dark: ["#1f1c1a", "near-black"], inks: [["#c8372d", "red"], ["#1f4e8c", "blue"], ["#e3b23c", "yellow"]] },
  { name: "Garden", light: ["#ece4cf", "parchment"], dark: ["#26342d", "deep green"], inks: [["#b8532f", "rust"], ["#3f8a6e", "green"], ["#e0a73c", "mustard"]] },
  { name: "Harbour", light: ["#e8e6df", "pale grey"], dark: ["#1b2433", "navy"], inks: [["#d0603a", "orange"], ["#3c6fb0", "cobalt"], ["#3f9aa6", "teal"]] },
  { name: "Dusk", light: ["#f1e3d3", "blush"], dark: ["#2a1d2b", "plum"], inks: [["#c2456b", "rose"], ["#5b4b9a", "violet"], ["#e8b04a", "amber"]] },
];

const PERMS: readonly [number, number, number][] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

function randomFeatures(r: Rng, palette: number): Features {
  return {
    palette,
    ground: r() < 0.65 ? 0 : 1,
    colors: int(r, 0, 5),
    sunKind: int(r, 0, 2) as 0 | 1 | 2,
    sunPos: int(r, 0, 3) as Corner,
    barCount: int(r, 2, 4) as 2 | 3 | 4,
    barDir: int(r, 0, 1) as 0 | 1,
    arcCorner: int(r, 0, 3) as Corner,
    accent: int(r, 0, 2) as 0 | 1 | 2,
    diagonal: int(r, 0, 1) as 0 | 1,
  };
}

function changeFeature(r: Rng, f: Features, k: FeatureKey): Features {
  const options: Record<FeatureKey, number[]> = {
    ground: [0, 1],
    colors: [0, 1, 2, 3, 4, 5],
    sunKind: [0, 1, 2],
    sunPos: [0, 1, 2, 3],
    barCount: [2, 3, 4],
    barDir: [0, 1],
    arcCorner: [0, 1, 2, 3],
    accent: [0, 1, 2],
    diagonal: [0, 1],
  };
  let opts = options[k].filter((v) => v !== f[k]);
  // a colour change must move the sun's colour, or it is too easy to miss
  if (k === "colors") opts = opts.filter((v) => PERMS[v][0] !== PERMS[f.colors][0]);
  // bar count changes by at least 2 when possible, so it reads at a glance
  if (k === "barCount") opts = opts.filter((v) => Math.abs(v - f.barCount) >= 2).length ? opts.filter((v) => Math.abs(v - f.barCount) >= 2) : opts;
  return { ...f, [k]: pick(r, opts) };
}

/** Feature keys on which two pieces differ. */
export function diffFeatures(a: Features, b: Features): FeatureKey[] {
  return ALL_FEATURES.filter((k) => a[k] !== b[k]);
}

export function isFairPair(a: Features, b: Features): boolean {
  const d = diffFeatures(a, b);
  const nonColor = d.filter((k) => !COLOR_FEATURES.includes(k));
  return a.palette === b.palette && d.length >= 3 && d.length <= 4 && nonColor.length >= 2 && d.some((k) => BIG_FEATURES.includes(k));
}

/** The pair for one trial: [left, right]. */
export function makePair(seed: string, trial: number): [Features, Features] {
  const r = rngFor(`yst:${seed}:pair:${trial}`);
  // a different palette on each of the 10 trials where possible
  const palette = shuffle(rngFor(`yst:${seed}:palettes`), [0, 1, 2, 3, 0, 1, 2, 3, 0, 1])[trial % 10];
  const a = randomFeatures(r, palette);
  const nChanges = r() < 0.5 ? 3 : 4;
  const big = pick(r, BIG_FEATURES);
  const rest = shuffle(
    r,
    ALL_FEATURES.filter((k) => k !== big)
  );
  const keys: FeatureKey[] = [big];
  for (const k of rest) {
    if (keys.length >= nChanges) break;
    const nonColor = keys.filter((x) => !COLOR_FEATURES.includes(x)).length;
    // keep at least two non-colour changes
    if (COLOR_FEATURES.includes(k) && nonColor < 2 && keys.length === nChanges - 1) continue;
    keys.push(k);
  }
  let b = a;
  for (const k of keys) b = changeFeature(r, b, k);
  return r() < 0.5 ? [a, b] : [b, a];
}

/** Compact id, used to check (in tests and in the browser) which piece is on screen. */
export function pieceId(f: Features): string {
  return `p${f.palette}g${f.ground}c${f.colors}k${f.sunKind}s${f.sunPos}n${f.barCount}d${f.barDir}a${f.arcCorner}x${f.accent}l${f.diagonal}`;
}

// ── Geometry ────────────────────────────────────────────────────────────────

export type Shape =
  | { t: "rect"; x: number; y: number; w: number; h: number; fill: string; rx?: number }
  | { t: "circle"; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number }
  | { t: "path"; d: string; fill: string; stroke?: string; sw?: number; cap?: "round" | "butt" };

const SUN_AT: Record<Corner, [number, number]> = { 0: [35, 40], 1: [65, 40], 2: [35, 86], 3: [65, 86] };
const CORNER_AT: Record<Corner, [number, number]> = { 0: [0, 0], 1: [W, 0], 2: [0, H], 3: [W, H] };

export function colorsOf(f: Features) {
  const p = PALETTES[f.palette];
  const [bg, bgName] = f.ground === 0 ? p.light : p.dark;
  const [contrast, contrastName] = f.ground === 0 ? p.dark : p.light;
  const perm = PERMS[f.colors];
  return {
    bg,
    bgName,
    contrast,
    contrastName,
    sun: p.inks[perm[0]],
    bars: p.inks[perm[1]],
    arc: p.inks[perm[2]],
  };
}

export function shapes(f: Features): Shape[] {
  const c = colorsOf(f);
  const out: Shape[] = [{ t: "rect", x: 0, y: 0, w: W, h: H, fill: c.bg }];

  // quarter arc hugging one corner
  const [ax, ay] = CORNER_AT[f.arcCorner];
  const R = 30;
  const sx = ax === 0 ? 1 : -1;
  const sy = ay === 0 ? 1 : -1;
  const sweep = sx * sy > 0 ? 1 : 0;
  out.push({ t: "path", d: `M${ax + sx * R} ${ay} A${R} ${R} 0 0 ${sweep} ${ax} ${ay + sy * R}`, fill: "none", stroke: c.arc[0], sw: 7, cap: "butt" });

  // diagonal line across the card
  out.push({
    t: "path",
    d: f.diagonal === 0 ? `M6 ${H - 6} L${W - 6} 6` : `M6 6 L${W - 6} ${H - 6}`,
    fill: "none",
    stroke: c.contrast,
    sw: 1.4,
    cap: "round",
  });

  // bars, on the side away from the sun
  const [scx, scy] = SUN_AT[f.sunPos];
  const n = f.barCount;
  if (f.barDir === 0) {
    const bw = 6,
      gap = 4;
    const span = n * bw + (n - 1) * gap;
    const x0 = scx < 50 ? 84 - span : 16;
    for (let i = 0; i < n; i++) out.push({ t: "rect", x: x0 + i * (bw + gap), y: 18, w: bw, h: 89, fill: c.bars[0] });
  } else {
    const bh = 5,
      gap = 4;
    const span = n * bh + (n - 1) * gap;
    const y0 = scy < 62 ? 108 - span : 17;
    for (let i = 0; i < n; i++) out.push({ t: "rect", x: 12, y: y0 + i * (bh + gap), w: 76, h: bh, fill: c.bars[0] });
  }

  // the sun
  const r = 20;
  if (f.sunKind === 0) out.push({ t: "circle", cx: scx, cy: scy, r, fill: c.sun[0] });
  else if (f.sunKind === 1) out.push({ t: "circle", cx: scx, cy: scy, r: r - 4, fill: "none", stroke: c.sun[0], sw: 8 });
  else {
    // half-disc, flat side facing the centre line
    const up = scy > 62;
    out.push({ t: "path", d: `M${scx - r} ${scy} A${r} ${r} 0 0 ${up ? 1 : 0} ${scx + r} ${scy} Z`, fill: c.sun[0] });
  }

  // small accent at the centre
  const cx = 50,
    cy = 62.5;
  if (f.accent === 0) {
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push({ t: "circle", cx: cx + i * 4.5, cy: cy + j * 4.5, r: 1.5, fill: c.contrast });
  } else if (f.accent === 1) {
    out.push({ t: "path", d: `M${cx} ${cy - 7} L${cx + 7} ${cy + 6} L${cx - 7} ${cy + 6} Z`, fill: c.contrast });
  } else {
    out.push({ t: "rect", x: cx - 5.5, y: cy - 5.5, w: 11, h: 11, fill: c.contrast });
  }
  return out;
}

const CORNER_NAME: Record<Corner, string> = { 0: "top-left", 1: "top-right", 2: "bottom-left", 3: "bottom-right" };
const SUN_NAME = ["solid circle", "ring", "half-circle"];
const ACCENT_NAME = ["a small grid of dots", "a small triangle", "a small square"];
const NUM = ["", "", "two", "three", "four"];

/** Alt text that names forms and places, not only colours. */
export function describe(f: Features): string {
  const c = colorsOf(f);
  const side = f.barDir === 0 ? (SUN_AT[f.sunPos][0] < 50 ? "on the right" : "on the left") : SUN_AT[f.sunPos][1] < 62 ? "along the bottom" : "along the top";
  return [
    `Abstract composition on a ${c.bgName} background.`,
    `A large ${c.sun[1]} ${SUN_NAME[f.sunKind]} at the ${CORNER_NAME[f.sunPos]}.`,
    `${NUM[f.barCount][0].toUpperCase()}${NUM[f.barCount].slice(1)} ${f.barDir === 0 ? "vertical" : "horizontal"} ${c.bars[1]} bars ${side}.`,
    `A ${c.arc[1]} quarter-arc in the ${CORNER_NAME[f.arcCorner]} corner,`,
    `${ACCENT_NAME[f.accent]} in the centre, and a thin line ${f.diagonal === 0 ? "rising" : "falling"} from left to right.`,
  ].join(" ");
}

/** A short noun phrase for the replay labels, e.g. "the blue ring". */
export function nickname(f: Features): string {
  return `the ${colorsOf(f).sun[1]} ${SUN_NAME[f.sunKind]}`;
}
