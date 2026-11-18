// Seamless pebbled-leather tile: jittered Worley cells (domed pebbles, creases between them),
// a sparser layer of longer creases, then lit as a relief. Grey around 128 for overlay blending.
// Usage: node scripts/hub-leather-texture.mjs 512 11 public/textures/leather.jpg 5 1.6
import sharp from "sharp";
const N = +process.argv[2] || 512, CELL = +process.argv[3] || 9, out = process.argv[4];
let s = 1337; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const T = 2 * Math.PI / N, ph = Array.from({ length: 8 }, () => rnd() * 6.283);
const warp = (x, y) => {
  const A = +process.argv[5] || 5;
  const dx = A * (Math.sin(3 * T * y + ph[0]) + 0.6 * Math.sin(7 * T * (x + y) + ph[1]) + 0.4 * Math.sin(13 * T * x + ph[2]));
  const dy = A * (Math.sin(4 * T * x + ph[3]) + 0.6 * Math.sin(9 * T * (x - y) + ph[4]) + 0.4 * Math.sin(11 * T * y + ph[5]));
  return [((x + dx) % N + N) % N, ((y + dy) % N + N) % N];
};
function worley(cell) {
  const g = Math.round(N / cell), c = N / g, pts = [];
  for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) pts.push([(i + 0.15 + 0.7 * rnd()) * c, (j + 0.15 + 0.7 * rnd()) * c]);
  const f1 = new Float32Array(N * N), f2 = new Float32Array(N * N);
  for (let Y = 0; Y < N; Y++) for (let X = 0; X < N; X++) {
    let x = X, y = Y; const [wx, wy] = warp(x, y); x = wx; y = wy;
    const ci = Math.floor(x / c), cj = Math.floor(y / c); let a = 1e9, b = 1e9;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
      const ii = (ci + di + g) % g, jj = (cj + dj + g) % g, p = pts[jj * g + ii];
      let dx = Math.abs(p[0] - x), dy = Math.abs(p[1] - y);
      if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy;
      const d = Math.hypot(dx, dy); if (d < a) { b = a; a = d; } else if (d < b) b = d;
    }
    f1[Y * N + X] = a / c; f2[Y * N + X] = b / c;
  }
  return [f1, f2];
}
const ss = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const [a1, a2] = worley(CELL), [b1, b2] = worley(CELL * 4.5);
const h = new Float32Array(N * N);
for (let k = 0; k < N * N; k++) {
  const pebble = 0.55 * ss(0, 0.55, a2[k] - a1[k]) + 0.45 * (1 - ss(0.1, 0.9, a1[k]));   // dome, falling into a crease
  const crease = 1 - 0.35 * (1 - ss(0, 0.1, b2[k] - b1[k]));        // occasional longer creases
  h[k] = pebble * crease + 0.04 * rnd();
}
for (let pass = 0; pass < 2; pass++) { const c = h.slice(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s2 = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s2 += c[((y + j + N) % N) * N + ((x + i + N) % N)]; h[y * N + x] = s2 / 9; } }
const L = [-0.55, -0.6, 0.58], px = Buffer.alloc(N * N), at = (x, y) => h[((y + N) % N) * N + ((x + N) % N)];
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const S = +process.argv[6] || 1.2, nx = -(at(x + 1, y) - at(x - 1, y)) * S, ny = -(at(x, y + 1) - at(x, y - 1)) * S, l = Math.hypot(nx, ny, 1);
  const d = (nx * L[0] + ny * L[1] + L[2]) / l;
  const v = 128 + (d - 0.58) * 78 + (h[y * N + x] - 0.6) * 20;
  px[y * N + x] = Math.max(0, Math.min(255, Math.round(v)));
}
await sharp(px, { raw: { width: N, height: N, channels: 1 } }).jpeg({ quality: 80 }).toFile(out);
console.log("wrote", out);
