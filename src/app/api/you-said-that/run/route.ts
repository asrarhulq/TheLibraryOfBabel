import { NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { parseRun, scoreRun } from "@/lib/you-said-that/protocol";
import { saveChoiceblindRun } from "@/lib/db/choiceblindRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const MAX_BODY = 2048;

// POST /api/you-said-that/run — store one anonymous run. The body holds choices only (which side, which
// button, slider positions, timings); every outcome (swapped, detected, defended) is recomputed here
// from the seed. Free text is never accepted: unknown fields are rejected.
export async function POST(request: NextRequest) {
  const limit = rateLimit(`yst:run:${clientKey(request.headers)}`, 12, 10 * 60 * 1000);
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
  const run = parsed.run;

  const scored = scoreRun(run);
  const id = randomBytes(8).toString("base64url").replace(/[-_]/g, "x").slice(0, 10);
  const deleteToken = randomBytes(18).toString("base64url");
  const result = { trials: scored.trials, statements: scored.statements, reversed: scored.reversed, totals: scored.totals };

  try {
    await saveChoiceblindRun({
      id,
      createdAt: new Date(),
      device: run.device,
      reducedMotion: run.reducedMotion,
      seed: run.seed,
      trials: scored.trials,
      // `selected` is left out: which statements someone feels strongest about is nobody's business
      statements: scored.statements.map((s) => ({
        manipulated: s.manipulated,
        detected: s.detected,
        defended: s.defended,
        accepted: s.accepted,
        falseAlarm: s.falseAlarm,
      })),
      totals: scored.totals,
      deleteHash: createHash("sha256").update(deleteToken).digest("hex"),
      v: 1,
    });
  } catch (e) {
    console.error("you-said-that run save failed", e);
    return Response.json({ error: "Could not save right now", id: null, deleteToken: null, ...result }, { status: 503 });
  }
  return Response.json({ id, deleteToken, ...result }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
