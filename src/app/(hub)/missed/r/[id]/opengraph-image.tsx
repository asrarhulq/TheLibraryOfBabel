import { getMissedRun } from "@/lib/db/missedRuns";
import { buildScene } from "@/lib/missed/engine";
import { renderResultImage, size as imageSize } from "./shareImage";

export const alt = "The Thing You Missed — a result";
export const size = imageSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = /^[A-Za-z0-9]{10}$/.test(id) ? await getMissedRun(id).catch(() => null) : null;
  const seconds = run ? Math.round(buildScene(run.seed, "critical", run.reducedMotion).star!.visibleSeconds) : 6;
  return renderResultImage(run, seconds);
}
