import { NextRequest } from "next/server";
import { computeChoiceblindStats, type ChoiceblindStats } from "@/lib/db/choiceblindRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
let cache: { at: number; data: ChoiceblindStats } | null = null;
let inflight: Promise<ChoiceblindStats> | null = null;

// GET /api/you-said-that/stats — aggregate detection and "defended" rates, cached ~60 s.
export async function GET(request: NextRequest) {
  const limit = rateLimit(`yst:stats:${clientKey(request.headers)}`, 60, 60 * 1000);
  if (!limit.ok) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  const headers = { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" };
  if (cache && Date.now() - cache.at < TTL_MS) return Response.json(cache.data, { headers });
  try {
    inflight ??= computeChoiceblindStats().finally(() => (inflight = null));
    const data = await inflight;
    cache = { at: Date.now(), data };
    return Response.json(data, { headers });
  } catch (e) {
    console.error("you-said-that stats failed", e);
    if (cache) return Response.json(cache.data, { headers });
    return Response.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
