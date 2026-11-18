import { loadRun } from "./load";
import { renderResultImage, size as imageSize } from "./shareImage";

export const alt = "You Said That? — a result";
export const size = imageSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await loadRun(id);
  return renderResultImage(run?.totals ?? null);
}
