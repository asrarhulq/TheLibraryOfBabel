import { renderShareImage } from "../shareImage";

// GET /birth-lottery/r/:seed/card — the same PNG as the Open Graph image, at a stable URL.
export async function GET(_req: Request, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  const res = renderShareImage(seed);
  res.headers.set("Cache-Control", "public, max-age=86400, immutable");
  return res;
}
