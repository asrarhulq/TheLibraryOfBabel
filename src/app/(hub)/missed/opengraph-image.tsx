import { renderResultImage, size as imageSize } from "./r/[id]/shareImage";

// Preview for /missed (the "Challenge a friend" link): circles only — never the star.
export const alt = "The Thing You Missed: a 90-second counting test";
export const size = imageSize;
export const contentType = "image/png";

export default function Image() {
  return renderResultImage(null, 6, { challenge: true });
}
