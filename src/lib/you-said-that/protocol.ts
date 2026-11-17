// The rules of "You Said That?", shared by the browser and the server. Pure functions only, so the
// server can recompute every outcome from the seed and the logged choices, and the tests can check them.

import { rngFor, shuffle, SEED_RE } from "./rng";

export { SEED_RE };

// ── Part 1: preferences ─────────────────────────────────────────────────────

export const TRIALS = 10;
/** Trials 4, 7 and 9 (0-based 3, 6, 8) return the card that was NOT chosen. */
export const MANIPULATED_TRIALS: readonly number[] = [3, 6, 8];
export const isManipulatedTrial = (i: number) => MANIPULATED_TRIALS.includes(i);

/** Which side of the pair (0 left, 1 right) is handed back after the person picks `picked`. */
export function shownSide(trial: number, picked: 0 | 1): 0 | 1 {
  return isManipulatedTrial(trial) ? ((1 - picked) as 0 | 1) : picked;
}

export const REASON_CHIPS = ["The colours", "The shapes", "It feels balanced", "The composition", "It's calmer", "Gut feeling"] as const;

// ── Part 2: values ──────────────────────────────────────────────────────────

/** Everyday value trade-offs: nothing party-political, nothing sensitive. */
export const STATEMENTS: readonly string[] = [
  "Honesty matters more than kindness.",
  "It is better to be loyal to friends than fair to strangers.",
  "People should follow their long-term plans, not their mood.",
  "A promise should be kept even when circumstances change.",
  "Hard work matters more than talent.",
  "It is better to know an uncomfortable truth than to stay comfortably unaware.",
  "It is better to be good at many things than excellent at one.",
  "Privacy matters more than convenience.",
];
export const SCALE_MIN = 1;
export const SCALE_MAX = 9;
export const SCALE_MID = 5;
export const REVERSED_COUNT = 2;
export const STRONGEST_COUNT = 3;

export function stanceLabel(v: number): string {
  if (v <= 2) return "You strongly disagree";
  if (v <= 4) return "You mostly disagree";
  if (v === 5) return "You're undecided";
  if (v <= 7) return "You mostly agree";
  return "You strongly agree";
}

/**
 * Which two summary cards are secretly reversed. Prefers answers at least 2 steps from the middle (a
 * reversal is then a real change of side), breaking ties in a seeded order. Deterministic in
 * (seed, values), so the server can recompute it.
 */
export function reversedStatements(seed: string, values: readonly number[]): number[] {
  const order = shuffle(rngFor(`yst:${seed}:statements`), STATEMENTS.map((_, i) => i));
  const strong = order.filter((i) => Math.abs(values[i] - SCALE_MID) >= 2);
  const mild = order.filter((i) => Math.abs(values[i] - SCALE_MID) === 1);
  const mid = order.filter((i) => values[i] === SCALE_MID);
  return [...strong, ...mild, ...mid].slice(0, REVERSED_COUNT).sort((a, b) => a - b);
}

/** The answer the summary shows: the real one, or its mirror image across the middle of the scale. */
export function shownValue(seed: string, i: number, v: number, reversed: boolean): number {
  if (!reversed) return v;
  if (v !== SCALE_MID) return SCALE_MIN + SCALE_MAX - v;
  // undecided has no opposite: move it clearly to one side (seeded), so the card still changes
  return rngFor(`yst:${seed}:mid:${i}`)() < 0.5 ? 3 : 7;
}

// ── A whole run ─────────────────────────────────────────────────────────────

export interface RunInput {
  seed: string;
  reducedMotion: boolean;
  device: "mobile" | "desktop";
  /** Part 1, one per trial: the side the person picked, whether they pressed "That's not what I picked", ms to pick. */
  picks: (0 | 1)[];
  flagged: boolean[];
  rtMs: number[];
  /** Part 2: slider answers (1–9), "That's not what I answered" per summary card, and the 3 they chose to explain. */
  values: number[];
  flaggedStatements: boolean[];
  strongest: number[];
}

export interface TrialOutcome {
  manipulated: boolean;
  detected: boolean; // a manipulated trial the person flagged
  defended: boolean; // a manipulated trial they gave a reason for without flagging it
  falseAlarm: boolean; // flagged a trial that was not manipulated
  rtMs: number;
}

export interface StatementOutcome {
  manipulated: boolean;
  detected: boolean;
  defended: boolean; // reversed, not flagged, and they chose it as one they feel strongly about and explained it
  accepted: boolean; // reversed and not flagged, but not one they explained
  falseAlarm: boolean;
  selected: boolean;
}

export interface Totals {
  manipulated: number; // always 5
  detected: number;
  defended: number;
  accepted: number;
  falseAlarms: number;
  part1Detected: number;
  part2Detected: number;
}

export interface Scored {
  trials: TrialOutcome[];
  statements: StatementOutcome[];
  reversed: number[];
  totals: Totals;
}

/**
 * Every outcome, from the seed and the logged choices alone. In part 1 a reason is required before the
 * person can move on, so an unflagged manipulated trial is always one they explained ("defended").
 */
export function scoreRun(x: Pick<RunInput, "seed" | "picks" | "flagged" | "rtMs" | "values" | "flaggedStatements" | "strongest">): Scored {
  const trials: TrialOutcome[] = x.picks.map((_, i) => {
    const m = isManipulatedTrial(i);
    return { manipulated: m, detected: m && x.flagged[i], defended: m && !x.flagged[i], falseAlarm: !m && x.flagged[i], rtMs: x.rtMs[i] };
  });
  const reversed = reversedStatements(x.seed, x.values);
  const statements: StatementOutcome[] = x.values.map((_, i) => {
    const m = reversed.includes(i);
    const f = x.flaggedStatements[i];
    const sel = x.strongest.includes(i);
    return { manipulated: m, detected: m && f, defended: m && !f && sel, accepted: m && !f && !sel, falseAlarm: !m && f, selected: sel };
  });
  const count = <T,>(xs: T[], p: (t: T) => boolean) => xs.filter(p).length;
  const part1Detected = count(trials, (t) => t.detected);
  const part2Detected = count(statements, (s) => s.detected);
  return {
    trials,
    statements,
    reversed,
    totals: {
      manipulated: MANIPULATED_TRIALS.length + REVERSED_COUNT,
      detected: part1Detected + part2Detected,
      defended: count(trials, (t) => t.defended) + count(statements, (s) => s.defended),
      accepted: count(statements, (s) => s.accepted),
      falseAlarms: count(trials, (t) => t.falseAlarm) + count(statements, (s) => s.falseAlarm),
      part1Detected,
      part2Detected,
    },
  };
}

// ── Server-side validation ──────────────────────────────────────────────────

const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;
const isBoolArr = (v: unknown, n: number): v is boolean[] => Array.isArray(v) && v.length === n && v.every((b) => typeof b === "boolean");

/** Strict shape check. Anything extra (such as free text) is rejected, not silently dropped. */
export function parseRun(b: unknown): { ok: true; run: RunInput } | { ok: false; error: string } {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { ok: false, error: "invalid body" };
  const o = b as Record<string, unknown>;
  const allowed = new Set(["seed", "reducedMotion", "device", "picks", "flagged", "rtMs", "values", "flaggedStatements", "strongest"]);
  for (const k of Object.keys(o)) if (!allowed.has(k)) return { ok: false, error: `unexpected field: ${k.slice(0, 40)}` };
  const { seed, reducedMotion, device, picks, flagged, rtMs, values, flaggedStatements, strongest } = o;
  if (typeof seed !== "string" || !SEED_RE.test(seed)) return { ok: false, error: "invalid seed" };
  if (typeof reducedMotion !== "boolean") return { ok: false, error: "invalid reducedMotion" };
  if (device !== "mobile" && device !== "desktop") return { ok: false, error: "invalid device" };
  if (!Array.isArray(picks) || picks.length !== TRIALS || !picks.every((p) => p === 0 || p === 1)) return { ok: false, error: "invalid picks" };
  if (!isBoolArr(flagged, TRIALS)) return { ok: false, error: "invalid flagged" };
  if (!Array.isArray(rtMs) || rtMs.length !== TRIALS || !rtMs.every((t) => isInt(t, 0, 600_000))) return { ok: false, error: "invalid rtMs" };
  if (!Array.isArray(values) || values.length !== STATEMENTS.length || !values.every((v) => isInt(v, SCALE_MIN, SCALE_MAX)))
    return { ok: false, error: "invalid values" };
  if (!isBoolArr(flaggedStatements, STATEMENTS.length)) return { ok: false, error: "invalid flaggedStatements" };
  if (
    !Array.isArray(strongest) ||
    strongest.length !== STRONGEST_COUNT ||
    !strongest.every((i) => isInt(i, 0, STATEMENTS.length - 1)) ||
    new Set(strongest).size !== STRONGEST_COUNT
  )
    return { ok: false, error: "invalid strongest" };
  return {
    ok: true,
    run: {
      seed,
      reducedMotion,
      device,
      picks: picks as (0 | 1)[],
      flagged,
      rtMs: rtMs as number[],
      values: values as number[],
      flaggedStatements,
      strongest: strongest as number[],
    },
  };
}

// ── Share text ──────────────────────────────────────────────────────────────

export function shareHeadline(t: Pick<Totals, "manipulated" | "detected" | "defended">): string {
  if (t.defended > 0) return "I explained a choice I never made. Can you catch it?";
  if (t.detected === t.manipulated) return "I caught every swap. Can you?";
  return `I caught ${t.detected} of ${t.manipulated} swaps. Can you?`;
}
export const CHALLENGE_TEXT = "A quick taste test: pick what you prefer and say why. Try it:";
