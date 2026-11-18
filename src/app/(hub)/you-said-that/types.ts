import type { Totals, TrialOutcome, StatementOutcome } from "@/lib/you-said-that/protocol";

/** What happened on one part-1 trial. `chips` and `text` stay in this browser tab; they are never sent. */
export interface TrialLog {
  pairIds: [string, string];
  picked: 0 | 1;
  /** The id of the piece that was actually on the returned card's face (read from the rendered state). */
  shownId: string;
  flagged: boolean;
  rtMs: number;
  chips: string[];
  text: string;
}

export interface Part2Log {
  values: number[];
  /** The answer each summary card actually displayed. */
  shownValues: number[];
  flagged: boolean[];
  strongest: number[];
  /** Local only, keyed by statement index. */
  texts: Record<number, string>;
}

export interface ServerResult {
  id: string | null;
  deleteToken: string | null;
  totals: Totals;
  trials: TrialOutcome[];
  statements: StatementOutcome[];
  reversed: number[];
}
