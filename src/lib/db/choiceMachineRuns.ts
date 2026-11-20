import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";
import type { Device, Score } from "@/lib/choice-machine/protocol";

// Anonymous "Choice Machine" runs: the eleven lefts and rights, and the score the server worked out
// from them. No ids tied to people, no IPs, no accounts, no timings.

export interface ChoiceMachineRunDoc {
  createdAt: Date;
  device: Device;
  choices: string; // "LRRL…"
  score: Score;
  v: 1;
}

let ready: Promise<unknown> | null = null;
async function runs(): Promise<Collection<ChoiceMachineRunDoc>> {
  const col = (await getDb()).collection<ChoiceMachineRunDoc>("choicemachine_runs");
  if (!ready) {
    ready = col.createIndex({ createdAt: -1 }).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return col;
}

export async function saveChoiceMachineRun(doc: ChoiceMachineRunDoc): Promise<void> {
  await (await runs()).insertOne(doc);
}

export interface ChoiceMachineStats {
  runs: number;
  /** % of runs where the sealed (11th) prediction was right. */
  sealedPct: number;
  /** % of all choices predicted. */
  allPct: number;
  /** % of consecutive choices where people switched sides. */
  switchPct: number;
  updatedAt: string;
}

export async function computeChoiceMachineStats(): Promise<ChoiceMachineStats> {
  const [r] = await (await runs())
    .aggregate<{ n: number; sealed: number; hits: number; switches: number }>([
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          sealed: { $sum: { $cond: ["$score.sealedHit", 1, 0] } },
          hits: { $sum: "$score.hits" },
          switches: { $sum: "$score.switches" },
        },
      },
    ])
    .toArray();
  const pct = (x: number, d: number) => (d ? Math.round((x / d) * 1000) / 10 : 0);
  const n = r?.n ?? 0;
  return {
    runs: n,
    sealedPct: pct(r?.sealed ?? 0, n),
    allPct: pct(r?.hits ?? 0, n * 11),
    switchPct: pct(r?.switches ?? 0, n * 10),
    updatedAt: new Date().toISOString(),
  };
}
