import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { buildScene, CHOICES, SEED_RE } from "@/lib/missed/engine";
import { saveMissedRun } from "@/lib/db/missedRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const CHOICE_IDS = new Set<string>(CHOICES.map((c) => c.id));
const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;

// POST /api/missed/run — store one anonymous run. Correctness is recomputed here from the seed;
// nothing the client says about being right is trusted.
export async function POST(request: NextRequest) {
  const limit = rateLimit(`missed:${clientKey(request.headers)}`, 12, 10 * 60 * 1000);
  if (!limit.ok) {
    return Response.json({ error: "Too many runs — try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }
  const len = Number(request.headers.get("content-length") || 0);
  if (len > 2048) return Response.json({ error: "Payload too large" }, { status: 413 });
  const text = await request.text().catch(() => "");
  if (!text || text.length > 2048) return Response.json({ error: "Invalid body" }, { status: 400 });

  let b: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    b = parsed;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { seed, reducedMotion, device, practiceAnswer, countAnswer, noticed, choice, confidence, r3Noticed, r3Choice } = b;
  if (typeof seed !== "string" || !SEED_RE.test(seed)) return Response.json({ error: "invalid seed" }, { status: 400 });
  if (typeof reducedMotion !== "boolean") return Response.json({ error: "invalid reducedMotion" }, { status: 400 });
  if (device !== "mobile" && device !== "desktop") return Response.json({ error: "invalid device" }, { status: 400 });
  if (!isInt(practiceAnswer, 0, 99) || !isInt(countAnswer, 0, 99)) return Response.json({ error: "invalid count" }, { status: 400 });
  if (typeof noticed !== "boolean" || typeof r3Noticed !== "boolean") return Response.json({ error: "invalid noticed" }, { status: 400 });
  // a choice (and confidence) only exists when the person said they noticed something
  if (noticed ? !(typeof choice === "string" && CHOICE_IDS.has(choice)) : choice !== null)
    return Response.json({ error: "invalid choice" }, { status: 400 });
  if (noticed ? !isInt(confidence, 1, 5) : confidence !== null) return Response.json({ error: "invalid confidence" }, { status: 400 });
  if (r3Noticed ? !(typeof r3Choice === "string" && CHOICE_IDS.has(r3Choice)) : r3Choice !== null)
    return Response.json({ error: "invalid round-3 choice" }, { status: 400 });

  const correctCount = buildScene(seed, "critical", reducedMotion).bounceCount;
  const practiceCorrect = buildScene(seed, "practice", reducedMotion).bounceCount;
  const identified = noticed && choice === "star";
  const r3Identified = r3Noticed && r3Choice === "star";
  const id = randomBytes(8).toString("base64url").replace(/[-_]/g, "x").slice(0, 10);

  try {
    await saveMissedRun({
      id,
      seed,
      createdAt: new Date(),
      device,
      reducedMotion,
      practiceAnswer,
      practiceCorrect,
      countAnswer,
      correctCount,
      noticed,
      identified,
      confidence: noticed ? (confidence as number) : null,
      r3Noticed,
      r3Identified,
      v: 1,
    });
  } catch (e) {
    console.error("missed run save failed", e);
    return Response.json({ error: "Could not save right now", correctCount, practiceCorrect, identified, r3Identified }, { status: 503 });
  }
  return Response.json({ id, correctCount, practiceCorrect, identified, r3Identified }, { status: 201 });
}
