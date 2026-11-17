import { NextRequest } from "next/server";
import { computeRoll, isValidYear, newSeed } from "@/lib/birth-lottery/roll";
import { saveBirthRoll } from "@/lib/db/birthRolls";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

// POST /api/birth-lottery/roll  { mode: "random" } | { mode: "year", year: -10000…present (≠ 0) }
// The server chooses the seed; the seed alone reproduces the roll at /birth-lottery/r/:seed.
export async function POST(request: NextRequest) {
  const limit = rateLimit(`birth:${clientKey(request.headers)}`, 40, 10 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many rolls — take a breath and try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const len = Number(request.headers.get("content-length") || 0);
  if (len > 1024) return Response.json({ error: "Payload too large" }, { status: 413 });
  const text = await request.text().catch(() => "");
  if (text.length > 1024) return Response.json({ error: "Payload too large" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text || "{}");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid body" }, { status: 400 });
  const { mode, year } = body as { mode?: unknown; year?: unknown };

  let seed: string;
  if (mode === "random") seed = newSeed(null);
  else if (mode === "year") {
    if (!isValidYear(year)) return Response.json({ error: "Year must be a whole number from 10,000 BCE to this year (no year 0)." }, { status: 400 });
    seed = newSeed(year);
  } else return Response.json({ error: "mode must be 'random' or 'year'" }, { status: 400 });

  const result = computeRoll(seed);
  if (!result) return Response.json({ error: "Could not roll" }, { status: 500 });

  try {
    await saveBirthRoll({
      seed: result.seed,
      mode: result.mode,
      year: result.year,
      region: result.region.id,
      continent: result.region.continent,
      outcomeAge: result.outcomeAge,
      v: result.dataVersion,
    });
  } catch (e) {
    console.error("birth roll save failed", e); // the roll still works without storage
  }

  return Response.json(result, { status: 201 });
}
