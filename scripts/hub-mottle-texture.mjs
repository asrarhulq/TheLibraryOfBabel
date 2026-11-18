// Seamless "uneven dye" tile for the hub book covers: soft fractal value noise, baked to a small
// greyscale JPEG (multiplied over the leather). Replaces an SVG feTurbulence filter, which is
// costly to rasterise on phones.
// Usage: node scripts/hub-mottle-texture.mjs public/textures/mottle.jpg
import sharp from "sharp";
const N = 420, out = process.argv[2];
let s = 4; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const octave = (cells) => {
  const g = Array.from({ length: cells * cells }, rnd), at = (i, j) => g[((j + cells) % cells) * cells + ((i + cells) % cells)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / N) * cells, fy = (y / N) * cells, i = Math.floor(fx), j = Math.floor(fy), u = sm(fx - i), v = sm(fy - j);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  };
};
const o = [octave(5), octave(10), octave(20)], w = [0.57, 0.29, 0.14];
const px = Buffer.alloc(N * N);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  // value noise is flatter than SVG fractal noise; stretch it to match the old look
  const a = 0.5 + (o.reduce((acc, f, k) => acc + f(x, y) * w[k], 0) - 0.5) * 1.9;
  const alpha = Math.max(0, Math.min(1, 0.48 - 0.9 * a)); // same curve as the old colour matrix
  px[y * N + x] = Math.round(255 * (1 - alpha));
}
await sharp(px, { raw: { width: N, height: N, channels: 1 } }).jpeg({ quality: 72 }).toFile(out);
console.log("wrote", out);
