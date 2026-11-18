// Builds the reveal's replay from what was actually logged during the run. The replay shows the piece
// that was really on the returned card (its recorded id), not a recomputation, and flags any
// disagreement between the log and the swap rule.

import { makePair, pieceId, type Features } from "./art";
import { MANIPULATED_TRIALS, shownSide } from "./protocol";

export interface PickLog {
  picked: 0 | 1;
  shownId: string;
  flagged: boolean;
}
export interface ValuesLog {
  values: number[];
  shownValues: number[];
  flagged: boolean[];
  strongest: number[];
}

export type ReplayItem =
  | {
      kind: "pick";
      index: number;
      picked: Features;
      shown: Features;
      pickedId: string;
      shownId: string;
      flagged: boolean;
    }
  | { kind: "stmt"; index: number; value: number; shown: number; flagged: boolean; selected: boolean };

export function buildReplay(seed: string, picks: PickLog[], v: ValuesLog): { items: ReplayItem[]; consistent: boolean } {
  let consistent = true;
  const items: ReplayItem[] = [];
  for (const i of MANIPULATED_TRIALS) {
    const p = picks[i];
    const pair = makePair(seed, i);
    const expected = pair[shownSide(i, p.picked)];
    // what was on screen, found by the recorded id
    const shown = pair.find((f) => pieceId(f) === p.shownId);
    if (!shown || pieceId(expected) !== p.shownId) consistent = false;
    items.push({
      kind: "pick",
      index: i,
      picked: pair[p.picked],
      shown: shown ?? expected,
      pickedId: pieceId(pair[p.picked]),
      shownId: p.shownId,
      flagged: p.flagged,
    });
  }
  // the non-manipulated trials must have returned the chosen piece
  picks.forEach((p, i) => {
    if (!MANIPULATED_TRIALS.includes(i) && pieceId(makePair(seed, i)[p.picked]) !== p.shownId) consistent = false;
  });
  v.values.forEach((value, i) => {
    if (v.shownValues[i] !== value) items.push({ kind: "stmt", index: i, value, shown: v.shownValues[i], flagged: v.flagged[i], selected: v.strongest.includes(i) });
  });
  return { items, consistent };
}
