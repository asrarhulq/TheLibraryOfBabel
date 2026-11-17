import { renderShareImage, size as imageSize } from "./shareImage";

export const alt = "The Birth Lottery — a rolled life";
export const size = imageSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  return renderShareImage(seed);
}
