import { NextRequest } from "next/server";
import { summarize, validateRunPayload } from "@/lib/memory/drm";
import { saveMemoryRun } from "@/lib/db/memoryRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

// POST /api/memory/run — save one anonymous run of "Memory That Lies".
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request.headers), 6, 10 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many submissions — try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) return Response.json({ error: "Payload too large" }, { status: 413 });

  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY_BYTES) return Response.json({ error: "Invalid body" }, { status: 400 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateRunPayload(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  // Scores are recomputed server-side from the raw answers — client-sent totals are never trusted.
  const summary = summarize(parsed.responses);

  try {
    const inserted = await saveMemoryRun(parsed.sessionId, summary);
    return Response.json({ ok: true, duplicate: !inserted, summary }, { status: inserted ? 201 : 200 });
  } catch (e) {
    console.error("memory run save failed", e);
    return Response.json({ error: "Could not save right now" }, { status: 503 });
  }
}
