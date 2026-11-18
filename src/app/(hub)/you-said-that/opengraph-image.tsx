import { renderResultImage, size as imageSize } from "./r/[id]/shareImage";

// Preview for /you-said-that (also the "try it on a friend" link): neutral, gives nothing away.
export const alt = "You Said That? — a quick taste test";
export const size = imageSize;
export const contentType = "image/png";

export default function Image() {
  return renderResultImage(null);
}
