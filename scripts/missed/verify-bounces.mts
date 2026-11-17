// Verifies the bounce-count logic of the motion engine.
//   node scripts/missed/verify-bounces.ts
//
// 1. Recounts white-circle wall bounces INDEPENDENTLY from the stored frame positions
//    (direction reversal next to a wall) and checks it equals the engine's own count.
// 2. Checks determinism (same seed → identical positions and count).
// 3. Reports count ranges, retries, and how long the star is visible.
// @ts-expect-error TS5097: Node runs this file directly (type stripping), which needs the .ts extension
import { buildScene, configFor, rngFrom, RADIUS, STAR_R, CORNER_FRAMES, type RoundKind } from "../../src/lib/missed/engine.ts";

const SEEDS = 1000;
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const r = rngFrom("verify");
const seeds = Array.from({ length: SEEDS }, () => Array.from({ length: 8 }, () => alphabet[Math.floor(r() * 36)]).join(""));

function recount(scene: ReturnType<typeof buildScene>): number {
  const { positions: P, n, frames, white } = scene;
  const near = (v: number) => v < RADIUS + 0.01 || v > 1 - RADIUS - 0.01; // genuine wall contact only
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (!white[i]) continue;
    let last = -999;
    for (let f = 1; f < frames - 1; f++) {
      const x0 = P[((f - 1) * n + i) * 2], x1 = P[(f * n + i) * 2], x2 = P[((f + 1) * n + i) * 2];
      const y0 = P[((f - 1) * n + i) * 2 + 1], y1 = P[(f * n + i) * 2 + 1], y2 = P[((f + 1) * n + i) * 2 + 1];
      const flipX = Math.sign(x1 - x0) !== Math.sign(x2 - x1) && (near(x1) || near(x2));
      const flipY = Math.sign(y1 - y0) !== Math.sign(y2 - y1) && (near(y1) || near(y2));
      // the reflected position is written in the bounce frame, so the reversal shows at f+1
      if ((flipX || flipY) && f - last > CORNER_FRAMES) count++;
      if (flipX || flipY) last = f;
    }
  }
  return count;
}

let failures = 0;
for (const kind of ["practice", "critical"] as RoundKind[]) {
  for (const reduced of [false, true]) {
    const counts: number[] = [];
    let mismatches = 0, outOfRange = 0, retries = 0, nondeterministic = 0;
    for (const s of seeds) {
      const a = buildScene(s, kind, reduced);
      const indep = recount(a);
      if (indep !== a.bounceCount) mismatches++;
      if (a.bounceFrames.some((f) => f >= a.frames - 30)) outOfRange++;
      const b = buildScene(s, kind, reduced);
      if (b.bounceCount !== a.bounceCount || b.positions.some((v, i) => v !== a.positions[i])) nondeterministic++;
      const [lo, hi] = configFor(kind, reduced).countRange;
      if (a.bounceCount < lo || a.bounceCount > hi) outOfRange++;
      retries += a.attempt;
      counts.push(a.bounceCount);
    }
    counts.sort((x, y) => x - y);
    failures += mismatches + nondeterministic;
    console.log(
      `${kind.padEnd(9)} reduced=${String(reduced).padEnd(5)} seeds=${SEEDS} count min/median/max=${counts[0]}/${counts[SEEDS >> 1]}/${counts[SEEDS - 1]}` +
        ` | independent recount mismatches=${mismatches} | nondeterministic=${nondeterministic} | out of range=${outOfRange} | avg retries=${(retries / SEEDS).toFixed(2)}`
    );
  }
}
const sc = buildScene(seeds[0], "critical", false);
console.log(`star: radius ${STAR_R.toFixed(3)} (3× circle ${RADIUS}), enters ${sc.star!.enter}s, crosses in ${sc.star!.cross}s, ≥half visible ${sc.star!.visibleSeconds.toFixed(2)}s, passes arena centre at ${(sc.star!.enter + sc.star!.cross / 2).toFixed(1)}s`);
if (failures) {
  console.error(`FAILED: ${failures}`);
  process.exit(1);
}
console.log("OK: engine count equals independent recount for every seed, and is deterministic.");
