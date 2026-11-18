import { clientKey, rateLimit } from "@/lib/memory/rateLimit";
import { loadRun } from "../load";
import { renderResultImage } from "../shareImage";

// GET /you-said-that/r/:id/card — the result image at a stable URL (preview + download).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`yst:card:${clientKey(req.headers)}`, 60, 60 * 1000).ok) return new Response("Too many requests", { status: 429 });
  const { id } = await params;
  const run = await loadRun(id);
  if (!run) return new Response("Not found", { status: 404 });
  const res = renderResultImage(run.totals);
  // short cache: a run can be deleted
  res.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
  return res;
}
