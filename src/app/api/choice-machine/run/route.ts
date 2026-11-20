import { NextRequest } from "next/server";
import { encodeChoices, parseRun, scoreRun } from "@/lib/choice-machine/protocol";
import { saveChoiceMachineRun } from "@/lib/db/choiceMachineRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const MAX_BODY = 256;

// POST /api/choice-machine/run — store one anonymous run. The body is exactly
// {choices: "LRRL…" (11 letters), device}. The score is recomputed here from the choices;
// anything else in the body is rejected.
export async function POST(request: NextRequest) {
  const limit = rateLimit(`cm:run:${clientKey(request.headers)}`, 20, 10 * 60 * 1000);
  if (!limit.ok) {
    return Response.json({ error: "Too many runs — try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return Response.json({ error: "Payload too large" }, { status: 413 });
  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY) return Response.json({ error: "Invalid body" }, { status: 400 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseRun(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const score = scoreRun(parsed.run.choices);
  try {
    await saveChoiceMachineRun({ createdAt: new Date(), device: parsed.run.device, choices: encodeChoices(parsed.run.choices), score, v: 1 });
  } catch (e) {
    console.error("choice-machine run save failed", e);
    return Response.json({ error: "Could not save right now", score }, { status: 503 });
  }
  return Response.json({ score }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
