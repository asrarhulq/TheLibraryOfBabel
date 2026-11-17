import { getMissedRun } from "@/lib/db/missedRuns";
import { buildScene } from "@/lib/missed/engine";
import { renderResultImage } from "../shareImage";

// GET /missed/r/:id/card — the result image at a stable URL (preview + download).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = /^[A-Za-z0-9]{10}$/.test(id) ? await getMissedRun(id).catch(() => null) : null;
  if (!run) return new Response("Not found", { status: 404 });
  const seconds = Math.round(buildScene(run.seed, "critical", run.reducedMotion).star!.visibleSeconds);
  const res = renderResultImage(run, seconds);
  res.headers.set("Cache-Control", "public, max-age=86400, immutable");
  return res;
}
