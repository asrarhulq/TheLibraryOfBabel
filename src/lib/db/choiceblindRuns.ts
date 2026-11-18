import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";
import type { StatementOutcome, Totals, TrialOutcome } from "@/lib/you-said-that/protocol";

// Anonymous "You Said That?" runs. A random run id, outcomes and response times. No free text (it never
// leaves the browser), no slider answers, no IPs, no accounts. `deleteHash` is a SHA-256 of a random
// token only the person's browser holds, so only they can delete the run.

export interface ChoiceblindRunDoc {
  id: string;
  createdAt: Date;
  device: "mobile" | "desktop";
  reducedMotion: boolean;
  seed: string;
  trials: TrialOutcome[];
  statements: Omit<StatementOutcome, "selected">[];
  totals: Totals;
  deleteHash: string;
  v: 1;
}

let ready: Promise<unknown> | null = null;
async function runs(): Promise<Collection<ChoiceblindRunDoc>> {
  const col = (await getDb()).collection<ChoiceblindRunDoc>("choiceblind_runs");
  if (!ready) {
    ready = Promise.all([col.createIndex({ id: 1 }, { unique: true }), col.createIndex({ createdAt: -1 })]).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return col;
}

export async function saveChoiceblindRun(doc: ChoiceblindRunDoc): Promise<void> {
  await (await runs()).insertOne(doc);
}

/** Public view of a run: no delete hash, no seed. */
export async function getChoiceblindRun(id: string): Promise<Pick<ChoiceblindRunDoc, "id" | "createdAt" | "totals"> | null> {
  return (await runs()).findOne({ id }, { projection: { _id: 0, id: 1, createdAt: 1, totals: 1 } });
}

export async function deleteChoiceblindRun(id: string, deleteHash: string): Promise<boolean> {
  const r = await (await runs()).deleteOne({ id, deleteHash });
  return r.deletedCount === 1;
}

export interface ChoiceblindStats {
  runs: number;
  /** % of all swapped items that were flagged. */
  detectedPct: number;
  part1DetectedPct: number;
  part2DetectedPct: number;
  /** % of people who defended at least one swapped choice. */
  defendedAnyPct: number;
  /** % of people who missed at least one swap. */
  missedAnyPct: number;
  updatedAt: string;
}

export async function computeChoiceblindStats(): Promise<ChoiceblindStats> {
  const [r] = await (await runs())
    .aggregate<{ n: number; det: number; man: number; p1: number; p2: number; defAny: number; missAny: number }>([
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          det: { $sum: "$totals.detected" },
          man: { $sum: "$totals.manipulated" },
          p1: { $sum: "$totals.part1Detected" },
          p2: { $sum: "$totals.part2Detected" },
          defAny: { $sum: { $cond: [{ $gt: ["$totals.defended", 0] }, 1, 0] } },
          missAny: { $sum: { $cond: [{ $lt: ["$totals.detected", "$totals.manipulated"] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  const pct = (x: number, d: number) => (d ? Math.round((x / d) * 1000) / 10 : 0);
  const n = r?.n ?? 0;
  return {
    runs: n,
    detectedPct: pct(r?.det ?? 0, r?.man ?? 0),
    part1DetectedPct: pct(r?.p1 ?? 0, n * 3),
    part2DetectedPct: pct(r?.p2 ?? 0, n * 2),
    defendedAnyPct: pct(r?.defAny ?? 0, n),
    missedAnyPct: pct(r?.missAny ?? 0, n),
    updatedAt: new Date().toISOString(),
  };
}
