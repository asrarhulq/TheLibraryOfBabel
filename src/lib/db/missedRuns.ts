import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";

// Anonymous "The Thing You Missed" runs. A random run id and the answers — no IPs, no accounts,
// nothing that identifies a person.

export interface MissedRunDoc {
  id: string;
  seed: string;
  createdAt: Date;
  device: "mobile" | "desktop";
  reducedMotion: boolean;
  practiceAnswer: number;
  practiceCorrect: number;
  countAnswer: number;
  correctCount: number;
  noticed: boolean;
  identified: boolean;
  confidence: number | null;
  r3Noticed: boolean;
  r3Identified: boolean;
  v: 1;
}

let ready: Promise<unknown> | null = null;
async function runs(): Promise<Collection<MissedRunDoc>> {
  const col = (await getDb()).collection<MissedRunDoc>("missed_runs");
  if (!ready) {
    ready = Promise.all([col.createIndex({ id: 1 }, { unique: true }), col.createIndex({ createdAt: -1 })]).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return col;
}

export async function saveMissedRun(doc: MissedRunDoc): Promise<void> {
  await (await runs()).insertOne(doc);
}

export async function getMissedRun(id: string): Promise<MissedRunDoc | null> {
  return (await runs()).findOne({ id }, { projection: { _id: 0 } });
}

export interface MissedStats {
  runs: number;
  /** % who identified the star in round 2 (counting). */
  identifiedPct: number;
  /** % who identified it in round 3 (just watching). */
  r3IdentifiedPct: number;
  /** % exactly right on the round-2 count. */
  exactCountPct: number;
  byDevice: Record<"mobile" | "desktop", { runs: number; identifiedPct: number }>;
  updatedAt: string;
}

export async function computeMissedStats(): Promise<MissedStats> {
  const col = await runs();
  const rows = await col
    .aggregate<{ _id: string; n: number; id2: number; id3: number; exact: number }>([
      {
        $group: {
          _id: "$device",
          n: { $sum: 1 },
          id2: { $sum: { $cond: ["$identified", 1, 0] } },
          id3: { $sum: { $cond: ["$r3Identified", 1, 0] } },
          exact: { $sum: { $cond: [{ $eq: ["$countAnswer", "$correctCount"] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  const sum = (k: "n" | "id2" | "id3" | "exact") => rows.reduce((s, r) => s + r[k], 0);
  const n = sum("n");
  const pct = (x: number, d: number) => (d ? Math.round((x / d) * 1000) / 10 : 0);
  const dev = (name: "mobile" | "desktop") => {
    const r = rows.find((x) => x._id === name);
    return { runs: r?.n ?? 0, identifiedPct: pct(r?.id2 ?? 0, r?.n ?? 0) };
  };
  return {
    runs: n,
    identifiedPct: pct(sum("id2"), n),
    r3IdentifiedPct: pct(sum("id3"), n),
    exactCountPct: pct(sum("exact"), n),
    byDevice: { mobile: dev("mobile"), desktop: dev("desktop") },
    updatedAt: new Date().toISOString(),
  };
}
