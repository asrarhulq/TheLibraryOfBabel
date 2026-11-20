import { NextRequest } from "next/server";
import { computeChoiceMachineStats, type ChoiceMachineStats } from "@/lib/db/choiceMachineRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
let cache: { at: number; data: ChoiceMachineStats } | null = null;
let inflight: Promise<ChoiceMachineStats> | null = null;

// GET /api/choice-machine/stats — how often the machine wins across everyone, cached ~60 s.
export async function GET(request: NextRequest) {
  const limit = rateLimit(`cm:stats:${clientKey(request.headers)}`, 60, 60 * 1000);
  if (!limit.ok) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  const headers = { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" };
  if (cache && Date.now() - cache.at < TTL_MS) return Response.json(cache.data, { headers });
  try {
    inflight ??= computeChoiceMachineStats().finally(() => (inflight = null));
    const data = await inflight;
    cache = { at: Date.now(), data };
    return Response.json(data, { headers });
  } catch (e) {
    console.error("choice-machine stats failed", e);
    if (cache) return Response.json(cache.data, { headers });
    return Response.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
