import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";

// Anonymous Birth Lottery rolls: seed, mode, year, region, outcome age, timestamp.
// No IPs, no identifiers, nothing about the person who rolled.

export interface BirthRollDoc {
  seed: string;
  mode: "random" | "year";
  year: number;
  region: string;
  continent: string;
  /** Age at death in completed years, or null if still alive at 80. */
  outcomeAge: number | null;
  createdAt: Date;
  v: number;
}

let ready: Promise<unknown> | null = null;

async function rolls(): Promise<Collection<BirthRollDoc>> {
  const col = (await getDb()).collection<BirthRollDoc>("birth_rolls");
  if (!ready) {
    ready = Promise.all([col.createIndex({ seed: 1 }, { unique: true }), col.createIndex({ createdAt: -1 })]).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return col;
}

export async function saveBirthRoll(doc: Omit<BirthRollDoc, "createdAt">): Promise<void> {
  const col = await rolls();
  try {
    await col.insertOne({ ...doc, createdAt: new Date() });
  } catch (e) {
    if ((e as { code?: number }).code !== 11000) throw e; // duplicate seed: ignore
  }
}

export interface BirthStats {
  totalRolls: number;
  diedBefore5Pct: number;
  diedBefore1Pct: number;
  reached80Pct: number;
  bornAfter1950Pct: number;
  bornInAsiaPct: number;
  updatedAt: string;
}

export async function computeBirthStats(): Promise<BirthStats> {
  const col = await rolls();
  const [r] = await col
    .aggregate<{ n: number; d5: number; d1: number; r80: number; a1950: number; asia: number }>([
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          d5: { $sum: { $cond: [{ $and: [{ $ne: ["$outcomeAge", null] }, { $lt: ["$outcomeAge", 5] }] }, 1, 0] } },
          d1: { $sum: { $cond: [{ $and: [{ $ne: ["$outcomeAge", null] }, { $lt: ["$outcomeAge", 1] }] }, 1, 0] } },
          r80: { $sum: { $cond: [{ $eq: ["$outcomeAge", null] }, 1, 0] } },
          a1950: { $sum: { $cond: [{ $gte: ["$year", 1950] }, 1, 0] } },
          asia: { $sum: { $cond: [{ $eq: ["$continent", "Asia"] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  const n = r?.n ?? 0;
  const pct = (x: number) => (n ? Math.round((x / n) * 1000) / 10 : 0);
  return {
    totalRolls: n,
    diedBefore5Pct: pct(r?.d5 ?? 0),
    diedBefore1Pct: pct(r?.d1 ?? 0),
    reached80Pct: pct(r?.r80 ?? 0),
    bornAfter1950Pct: pct(r?.a1950 ?? 0),
    bornInAsiaPct: pct(r?.asia ?? 0),
    updatedAt: new Date().toISOString(),
  };
}
