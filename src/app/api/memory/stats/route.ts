import { computeMemoryStats, type MemoryStats } from "@/lib/db/memoryRuns";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
let cache: { at: number; data: MemoryStats } | null = null;
let inflight: Promise<MemoryStats> | null = null;

// GET /api/memory/stats — aggregate per-lure percentages. Cached for a minute in-process
// and at the CDN, so a burst of reveals costs one aggregation.
export async function GET() {
  const headers = { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" };
  if (cache && Date.now() - cache.at < TTL_MS) return Response.json(cache.data, { headers });

  try {
    inflight ??= computeMemoryStats().finally(() => (inflight = null));
    const data = await inflight;
    cache = { at: Date.now(), data };
    return Response.json(data, { headers });
  } catch (e) {
    console.error("memory stats failed", e);
    if (cache) return Response.json(cache.data, { headers }); // serve stale over nothing
    return Response.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
