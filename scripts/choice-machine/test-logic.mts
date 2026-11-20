// node --no-warnings --import ./scripts/you-said-that/ts-resolve.mjs --test scripts/choice-machine/test-logic.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { replay, type Side } from "../../src/lib/choice-machine/predictor";
import { parseRun, scoreRun, TOTAL, encodeChoices, longestRun } from "../../src/lib/choice-machine/protocol";

let s = 7;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// A chooser that switches with probability p and refuses runs longer than maxRun.
function chooser(p: number, maxRun = 99): Side[] {
  const c: Side[] = [rnd() < 0.5 ? 0 : 1];
  while (c.length < TOTAL) {
    const last = c[c.length - 1];
    let next: Side = rnd() < p ? ((1 - last) as Side) : last;
    if (longestRun([...c, next]) > maxRun) next = (1 - last) as Side;
    c.push(next);
  }
  return c;
}

function accuracy(gen: () => Side[], n = 4000) {
  let hits = 0, sealed = 0;
  for (let i = 0; i < n; i++) {
    const r = scoreRun(gen());
    hits += r.hits;
    sealed += r.sealedHit ? 1 : 0;
  }
  return { all: hits / (n * TOTAL), sealed: sealed / n };
}

test("deterministic: same choices, same predictions", () => {
  const c = chooser(0.6);
  assert.deepEqual(replay(c).steps.map((x) => x.predicted), replay(c).steps.map((x) => x.predicted));
});

test("predictions never depend on the choice being predicted", () => {
  const c = chooser(0.6);
  for (let i = 0; i < TOTAL; i++) {
    const flipped = [...c];
    flipped[i] = (1 - flipped[i]) as Side;
    assert.equal(replay(c).steps[i].predicted, replay(flipped).steps[i].predicted);
  }
});

test("a fair coin is not predictable (about 50%)", () => {
  const a = accuracy(() => chooser(0.5));
  console.log("coin", a);
  assert.ok(a.all > 0.45 && a.all < 0.55);
});

test("human-like over-switching is predictable", () => {
  const a = accuracy(() => chooser(0.6, 3));
  console.log("human-like (switch .6, runs<=3)", a);
  const b = accuracy(() => chooser(0.7, 3));
  console.log("strong switcher (.7)", b);
  const c = accuracy(() => chooser(0.3));
  console.log("sticker (.3)", c);
  assert.ok(a.sealed > 0.55);
});

test("parseRun accepts only the exact shape", () => {
  assert.equal(parseRun({ choices: "LRLRLRLRLRL", device: "mobile" }).ok, true);
  assert.equal(parseRun({ choices: "LRLRLRLRLR", device: "mobile" }).ok, false);
  assert.equal(parseRun({ choices: "LRLRLRLRLRX", device: "mobile" }).ok, false);
  assert.equal(parseRun({ choices: "LRLRLRLRLRL", device: "tv" }).ok, false);
  assert.equal(parseRun({ choices: "LRLRLRLRLRL", device: "mobile", hits: 11 }).ok, false);
  assert.equal(parseRun([]).ok, false);
  const p = parseRun({ choices: "RRLLRLRLLRL", device: "desktop" });
  assert.ok(p.ok && encodeChoices(p.run.choices) === "RRLLRLRLLRL");
});
