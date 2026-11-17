// Logic tests for "You Said That?".
// Run: node --import ./scripts/you-said-that/ts-resolve.mjs --test scripts/you-said-that/test-logic.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { makePair, isFairPair, diffFeatures, pieceId, COLOR_FEATURES, describe } from "../../src/lib/you-said-that/art.ts";
import {
  MANIPULATED_TRIALS,
  TRIALS,
  STATEMENTS,
  shownSide,
  reversedStatements,
  shownValue,
  scoreRun,
  parseRun,
  stanceLabel,
} from "../../src/lib/you-said-that/protocol.ts";

const seeds = Array.from({ length: 500 }, (_, i) => `t${i.toString(36).padStart(7, "0")}`);

test("manipulated trials are 4, 7 and 9 (1-based)", () => {
  assert.deepEqual(
    MANIPULATED_TRIALS.map((i) => i + 1),
    [4, 7, 9]
  );
});

test("swap rule: manipulated trials hand back the rejected side, all others the chosen side", () => {
  for (let i = 0; i < TRIALS; i++)
    for (const p of [0, 1] as const) {
      const s = shownSide(i, p);
      if (MANIPULATED_TRIALS.includes(i)) assert.equal(s, 1 - p, `trial ${i + 1}`);
      else assert.equal(s, p, `trial ${i + 1}`);
    }
});

test("pairs are deterministic, distinct and fair for every trial", () => {
  for (const seed of seeds)
    for (let t = 0; t < TRIALS; t++) {
      const [a, b] = makePair(seed, t);
      const [a2, b2] = makePair(seed, t);
      assert.equal(pieceId(a), pieceId(a2));
      assert.equal(pieceId(b), pieceId(b2));
      assert.notEqual(pieceId(a), pieceId(b));
      const d = diffFeatures(a, b);
      assert.ok(d.length >= 3, `${seed}/${t}: only ${d.length} differences`);
      assert.ok(d.filter((k) => !COLOR_FEATURES.includes(k)).length >= 2, `${seed}/${t}: relies on colour`);
      assert.ok(isFairPair(a, b));
      assert.notEqual(describe(a), describe(b), "alt text must tell the two apart");
    }
});

test("the shown piece on a swapped trial is exactly the other piece of the pair", () => {
  for (const seed of seeds.slice(0, 50))
    for (const t of MANIPULATED_TRIALS)
      for (const p of [0, 1] as const) {
        const pair = makePair(seed, t);
        assert.equal(pieceId(pair[shownSide(t, p)]), pieceId(pair[1 - p]));
        assert.notEqual(pieceId(pair[shownSide(t, p)]), pieceId(pair[p]));
      }
});

test("statement reversal: two cards, real change of side, deterministic", () => {
  for (const seed of seeds) {
    const r = (k: number) => 1 + ((k * 7 + seed.charCodeAt(3)) % 9);
    const values = STATEMENTS.map((_, i) => r(i));
    const rev = reversedStatements(seed, values);
    assert.equal(rev.length, 2);
    assert.deepEqual(rev, reversedStatements(seed, values));
    for (const i of rev) {
      const v = values[i];
      const s = shownValue(seed, i, v, true);
      assert.notEqual(s, v);
      if (v !== 5) {
        assert.equal(s, 10 - v);
        assert.notEqual(stanceLabel(s), stanceLabel(v));
      }
    }
    for (let i = 0; i < 8; i++) if (!rev.includes(i)) assert.equal(shownValue(seed, i, values[i], false), values[i]);
  }
});

test("strong answers are reversed before mild or undecided ones", () => {
  const values = [5, 5, 4, 9, 5, 6, 5, 2];
  assert.deepEqual(reversedStatements("abcd1234", values), [3, 7]);
  const allMid = [5, 5, 5, 5, 5, 5, 5, 5];
  const rev = reversedStatements("abcd1234", allMid);
  assert.equal(rev.length, 2);
  for (const i of rev) assert.notEqual(shownValue("abcd1234", i, 5, true), 5);
});

const base = {
  seed: "abcd1234",
  reducedMotion: false,
  device: "desktop",
  picks: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  flagged: Array(10).fill(false),
  rtMs: Array(10).fill(1500),
  values: [5, 5, 4, 9, 5, 6, 5, 2],
  flaggedStatements: Array(8).fill(false),
  strongest: [3, 0, 1],
};

test("scoring: nobody flags anything", () => {
  const s = scoreRun(base as never);
  assert.equal(s.totals.manipulated, 5);
  assert.equal(s.totals.detected, 0);
  // 3 part-1 swaps explained + statement 3 (reversed, chosen); statement 7 reversed but not chosen
  assert.equal(s.totals.defended, 4);
  assert.equal(s.totals.accepted, 1);
  assert.equal(s.totals.falseAlarms, 0);
});

test("scoring: catching every swap, plus one false alarm", () => {
  const flagged = Array(10).fill(false);
  for (const i of MANIPULATED_TRIALS) flagged[i] = true;
  flagged[0] = true;
  const fs = Array(8).fill(false);
  fs[3] = fs[7] = true;
  const s = scoreRun({ ...(base as never), flagged, flaggedStatements: fs });
  assert.equal(s.totals.detected, 5);
  assert.equal(s.totals.defended, 0);
  assert.equal(s.totals.falseAlarms, 1);
  assert.equal(s.totals.part1Detected, 3);
  assert.equal(s.totals.part2Detected, 2);
});

test("validation rejects bad or extra input, including free text", () => {
  assert.equal(parseRun(base).ok, true);
  assert.equal(parseRun({ ...base, explanation: "I liked the colours" }).ok, false);
  assert.equal(parseRun({ ...base, seed: "BAD" }).ok, false);
  assert.equal(parseRun({ ...base, picks: [0, 1, 2, 0, 0, 0, 0, 0, 0, 0] }).ok, false);
  assert.equal(parseRun({ ...base, picks: base.picks.slice(1) }).ok, false);
  assert.equal(parseRun({ ...base, values: [0, 5, 5, 5, 5, 5, 5, 5] }).ok, false);
  assert.equal(parseRun({ ...base, strongest: [1, 1, 2] }).ok, false);
  assert.equal(parseRun({ ...base, strongest: [1, 2] }).ok, false);
  assert.equal(parseRun({ ...base, rtMs: Array(10).fill(-1) }).ok, false);
  assert.equal(parseRun({ ...base, flagged: Array(10).fill("yes") }).ok, false);
  assert.equal(parseRun({ ...base, device: "tablet" }).ok, false);
  assert.equal(parseRun([base]).ok, false);
  // client-reported outcomes are not a thing: these fields are refused
  assert.equal(parseRun({ ...base, detected: 5 }).ok, false);
});
