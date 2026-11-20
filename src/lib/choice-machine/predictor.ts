// The Choice Machine's predictor. Deterministic and dependency-free, so the browser (which plays the
// game) and the server (which re-scores a submitted run) always agree.
//
// It is a small "mixture of experts", the same family of trick as Aaronson's f/d predictor: several
// simple rules each guess the next choice from the choices so far, and the machine trusts whichever
// rules have been right about *you*. No rule knows anything about you in advance except one prior,
// that people trying to choose freely tend to switch sides more than chance would.

export type Side = 0 | 1; // 0 = left, 1 = right
export const SIDE_NAME = ["left", "right"] as const;

export type ExpertId = "switch" | "stick" | "after1" | "after2" | "after3" | "balance" | "streak";

export const EXPERTS: { id: ExpertId; prior: number; name: string; tell: string }[] = [
  { id: "switch", prior: 1.25, name: "Switcher", tell: "You tend to switch sides." },
  { id: "stick", prior: 0.6, name: "Sticker", tell: "You tend to stay on the same side." },
  { id: "after1", prior: 0.9, name: "Echo of one", tell: "What you do next depends on your last choice." },
  { id: "after2", prior: 1.0, name: "Echo of two", tell: "You repeat little two-step patterns." },
  { id: "after3", prior: 1.1, name: "Echo of three", tell: "You repeat longer patterns." },
  { id: "balance", prior: 0.8, name: "Evener", tell: "You keep left and right even." },
  { id: "streak", prior: 1.0, name: "Streak-breaker", tell: "After two the same, you break the streak." },
];

const HIT = 1.8;
const MISS = 0.5;

/** The side that most often followed the last `k` choices earlier in the history, if any. */
function after(h: Side[], k: number): Side | null {
  if (h.length <= k) return null;
  const key = h.slice(-k).join("");
  const n = [0, 0];
  for (let i = k; i < h.length; i++) if (h.slice(i - k, i).join("") === key) n[h[i]]++;
  return n[0] === n[1] ? null : n[0] > n[1] ? 0 : 1;
}

function expertGuess(id: ExpertId, h: Side[]): Side | null {
  const last = h[h.length - 1];
  switch (id) {
    case "switch":
      return h.length ? ((1 - last) as Side) : null;
    case "stick":
      return h.length ? last : null;
    case "after1":
      return after(h, 1);
    case "after2":
      return after(h, 2);
    case "after3":
      return after(h, 3);
    case "balance": {
      const r = h.filter((x) => x === 1).length;
      const l = h.length - r;
      return l === r ? null : l < r ? 0 : 1;
    }
    case "streak":
      return h.length >= 2 && h[h.length - 1] === h[h.length - 2] ? ((1 - last) as Side) : null;
  }
}

export interface Step {
  /** What the machine predicted for this choice, before it was made. */
  predicted: Side;
  /** Each expert's guess for this choice (null = no opinion). */
  guesses: Record<ExpertId, Side | null>;
  /** Trust in each expert just before this choice. */
  weights: Record<ExpertId, number>;
}

export function initialWeights(): Record<ExpertId, number> {
  return Object.fromEntries(EXPERTS.map((e) => [e.id, e.prior])) as Record<ExpertId, number>;
}

/** Predict the next choice from history `h` with the given trust weights. */
export function predict(h: Side[], weights: Record<ExpertId, number>): Omit<Step, "weights"> {
  const guesses = {} as Record<ExpertId, Side | null>;
  const vote = [0, 0];
  for (const e of EXPERTS) {
    const g = expertGuess(e.id, h);
    guesses[e.id] = g;
    if (g !== null) vote[g] += weights[e.id];
  }
  // No opinions at all (the very first choice): guess right. Ties: guess a switch.
  let predicted: Side;
  if (vote[0] === vote[1]) predicted = h.length ? ((1 - h[h.length - 1]) as Side) : 1;
  else predicted = vote[0] > vote[1] ? 0 : 1;
  return { predicted, guesses };
}

/** Update trust after seeing the actual choice. */
export function learn(weights: Record<ExpertId, number>, guesses: Record<ExpertId, Side | null>, actual: Side) {
  const w = { ...weights };
  for (const e of EXPERTS) {
    const g = guesses[e.id];
    if (g !== null) w[e.id] = Math.min(20, Math.max(0.05, w[e.id] * (g === actual ? HIT : MISS)));
  }
  return w;
}

/** Replay a whole sequence: the prediction made before each choice, and the final trust weights. */
export function replay(choices: Side[]): { steps: Step[]; finalWeights: Record<ExpertId, number> } {
  let weights = initialWeights();
  const steps: Step[] = [];
  for (let i = 0; i < choices.length; i++) {
    const h = choices.slice(0, i);
    const p = predict(h, weights);
    steps.push({ ...p, weights });
    weights = learn(weights, p.guesses, choices[i]);
  }
  return { steps, finalWeights: weights };
}
