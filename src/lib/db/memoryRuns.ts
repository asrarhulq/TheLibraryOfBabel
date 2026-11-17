import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";
import { LURES, type Lure, type RunSummary } from "../memory/drm";

// Anonymous "Memory That Lies" runs. No IPs, no traveler ids, no personal data —
// just a random per-run session id, a timestamp and the scored results.

export interface MemoryRunDoc extends RunSummary {
  sessionId: string;
  createdAt: Date;
  v: 1;
}

let indexesReady: Promise<unknown> | null = null;

async function runs(): Promise<Collection<MemoryRunDoc>> {
  const col = (await getDb()).collection<MemoryRunDoc>("memory_runs");
  if (!indexesReady) {
    indexesReady = Promise.all([
      col.createIndex({ sessionId: 1 }, { unique: true }),
      col.createIndex({ createdAt: -1 }),
    ]).catch((e) => {
      indexesReady = null; // retry on next call
      throw e;
    });
  }
  await indexesReady;
  return col;
}

/** Insert a run. Returns false if this session id was already saved (idempotent re-submit). */
export async function saveMemoryRun(sessionId: string, summary: RunSummary): Promise<boolean> {
  const col = await runs();
  try {
    await col.insertOne({ sessionId, createdAt: new Date(), v: 1, ...summary });
    return true;
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return false;
    throw e;
  }
}

export interface MemoryStats {
  totalRuns: number;
  lures: Record<Lure, { falseRecallPct: number; avgConfidence: number | null }>;
  avgFalseRecalls: number;
  avgHitRate: number;
  avgControlFalseAlarmRate: number;
  /** distribution[k] = number of runs that falsely recalled exactly k lures (k = 0…5). */
  distribution: number[];
  updatedAt: string;
}

export async function computeMemoryStats(): Promise<MemoryStats> {
  const col = await runs();
  const [res] = await col
    .aggregate<{
      overall: { n: number; avgFalse: number; avgHit: number; avgFA: number }[];
      perLure: { _id: Lure; n: number; recalled: number; conf: number | null }[];
      dist: { _id: number; n: number }[];
    }>([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                n: { $sum: 1 },
                avgFalse: { $avg: "$falseRecallCount" },
                avgHit: { $avg: "$realHitRate" },
                avgFA: { $avg: "$controlFalseAlarmRate" },
              },
            },
          ],
          perLure: [
            { $unwind: "$lures" },
            {
              $group: {
                _id: "$lures.lure",
                n: { $sum: 1 },
                recalled: { $sum: { $cond: ["$lures.falselyRecalled", 1, 0] } },
                conf: { $avg: { $cond: ["$lures.falselyRecalled", "$lures.confidence", null] } },
              },
            },
          ],
          dist: [{ $group: { _id: "$falseRecallCount", n: { $sum: 1 } } }],
        },
      },
    ])
    .toArray();

  const o = res?.overall[0];
  const lures = {} as MemoryStats["lures"];
  for (const l of LURES) {
    const p = res?.perLure.find((x) => x._id === l);
    lures[l] = {
      falseRecallPct: p && p.n ? Math.round((p.recalled / p.n) * 100) : 0,
      avgConfidence: p?.conf != null ? Math.round(p.conf * 10) / 10 : null,
    };
  }
  const distribution = [0, 0, 0, 0, 0, 0];
  for (const d of res?.dist ?? []) if (d._id >= 0 && d._id <= 5) distribution[d._id] = d.n;

  return {
    totalRuns: o?.n ?? 0,
    lures,
    avgFalseRecalls: o ? Math.round(o.avgFalse * 10) / 10 : 0,
    avgHitRate: o ? Math.round(o.avgHit * 100) / 100 : 0,
    avgControlFalseAlarmRate: o ? Math.round(o.avgFA * 100) / 100 : 0,
    distribution,
    updatedAt: new Date().toISOString(),
  };
}
