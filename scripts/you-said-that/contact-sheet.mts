// Writes an HTML contact sheet of every pair for the given seeds, with the differing features listed.
// Run: node --import ./scripts/you-said-that/ts-resolve.mjs scripts/you-said-that/contact-sheet.mts out.html seed1 seed2 …
import { writeFileSync } from "node:fs";
import { makePair, shapes, diffFeatures, H, W, type Features, type Shape } from "../../src/lib/you-said-that/art.ts";
import { MANIPULATED_TRIALS, TRIALS } from "../../src/lib/you-said-that/protocol.ts";

const svgShape = (s: Shape) =>
  s.t === "rect"
    ? `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.fill}"/>`
    : s.t === "circle"
      ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}" stroke="${s.stroke ?? "none"}" stroke-width="${s.sw ?? 0}"/>`
      : `<path d="${s.d}" fill="${s.fill}" stroke="${s.stroke ?? "none"}" stroke-width="${s.sw ?? 0}" stroke-linecap="${s.cap ?? "butt"}"/>`;
const svg = (f: Features) => `<svg viewBox="0 0 ${W} ${H}" width="100" height="125">${shapes(f).map(svgShape).join("")}</svg>`;

const [out, ...seeds] = process.argv.slice(2);
let html = `<!doctype html><meta charset="utf-8"><style>body{font:12px system-ui;background:#ddd;margin:12px}h2{margin:12px 0 4px}
.row{display:flex;flex-wrap:wrap;gap:10px}.pair{background:#fff;padding:6px;border-radius:6px}.pair.m{outline:2px solid #c33}.pair div{display:flex;gap:4px}.pair p{margin:4px 0 0;width:204px}</style>`;
for (const seed of seeds) {
  html += `<h2>seed ${seed}</h2><div class="row">`;
  for (let t = 0; t < TRIALS; t++) {
    const [a, b] = makePair(seed, t);
    html += `<div class="pair${MANIPULATED_TRIALS.includes(t) ? " m" : ""}"><div>${svg(a)}${svg(b)}</div><p>#${t + 1}: ${diffFeatures(a, b).join(", ")}</p></div>`;
  }
  html += `</div>`;
}
writeFileSync(out, html);
