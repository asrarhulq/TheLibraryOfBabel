import { EXPERTS, replay, type ExpertId, type Side } from "./predictor";

// Shape of a run and how it is scored. The only thing a run contains is the sequence of lefts and
// rights; every outcome is recomputed from it (never trusted from the client).

export const TOTAL = 11; // ten warm-up choices, then the sealed one
export const SEALED_INDEX = TOTAL - 1;

export type Device = "mobile" | "desktop";

export interface RunInput {
  choices: Side[];
  device: Device;
}

export interface Score {
  hits: number; // predictions that matched, out of TOTAL
  sealedHit: boolean;
  switches: number; // out of TOTAL - 1
  longestRun: number;
  rights: number;
  topExpert: ExpertId;
}

export function longestRun(c: Side[]): number {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < c.length; i++) {
    cur = i && c[i] === c[i - 1] ? cur + 1 : 1;
    best = Math.max(best, cur);
  }
  return best;
}

export function scoreRun(choices: Side[]): Score {
  const { steps, finalWeights } = replay(choices);
  const hits = steps.filter((s, i) => s.predicted === choices[i]).length;
  let switches = 0;
  for (let i = 1; i < choices.length; i++) if (choices[i] !== choices[i - 1]) switches++;
  const topExpert = [...EXPERTS].sort((a, b) => finalWeights[b.id] - finalWeights[a.id])[0].id;
  return {
    hits,
    sealedHit: steps[SEALED_INDEX]?.predicted === choices[SEALED_INDEX],
    switches,
    longestRun: longestRun(choices),
    rights: choices.filter((c) => c === 1).length,
    topExpert,
  };
}

/** Strict parser for the run endpoint: exactly {choices: "LRRL…" (11 chars), device}. Nothing else. */
export function parseRun(body: unknown): { ok: true; run: RunInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Body must be an object" };
  const o = body as Record<string, unknown>;
  const keys = Object.keys(o).sort().join(",");
  if (keys !== "choices,device") return { ok: false, error: "Unexpected fields" };
  if (typeof o.choices !== "string" || !new RegExp(`^[LR]{${TOTAL}}$`).test(o.choices)) return { ok: false, error: "Invalid choices" };
  if (o.device !== "mobile" && o.device !== "desktop") return { ok: false, error: "Invalid device" };
  return { ok: true, run: { choices: [...o.choices].map((c) => (c === "R" ? 1 : 0)) as Side[], device: o.device } };
}

export const encodeChoices = (c: Side[]) => c.map((x) => (x ? "R" : "L")).join("");

export function shareText(s: Pick<Score, "sealedHit" | "hits">): string {
  return s.sealedHit
    ? `The Choice Machine predicted my "free" choice (and ${s.hits} of my ${TOTAL}). Can it predict yours?`
    : `I beat the Choice Machine on the sealed choice. It still got ${s.hits} of ${TOTAL}. Can you beat it?`;
}
