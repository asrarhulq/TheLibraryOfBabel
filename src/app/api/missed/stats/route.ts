import { computeMissedStats, type MissedStats } from "@/lib/db/missedRuns";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
let cache: { at: number; data: MissedStats } | null = null;
let inflight: Promise<MissedStats> | null = null;

// GET /api/missed/stats — aggregate noticing rates, cached ~60 s.
export async function GET() {
  const headers = { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" };
  if (cache && Date.now() - cache.at < TTL_MS) return Response.json(cache.data, { headers });
  try {
    inflight ??= computeMissedStats().finally(() => (inflight = null));
    const data = await inflight;
    cache = { at: Date.now(), data };
    return Response.json(data, { headers });
  } catch (e) {
    console.error("missed stats failed", e);
    if (cache) return Response.json(cache.data, { headers });
    return Response.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
