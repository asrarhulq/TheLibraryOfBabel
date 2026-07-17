import { NextRequest } from 'next/server';
import { recordWords } from '@/lib/db/travelerData';
import { travelerIdFrom, parseCoord } from '../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const wordCount = Math.max(0, Math.min(5000, Number(body?.wordCount) || 0));
  const newlyUnlocked = await recordWords(travelerId, coord, wordCount, Date.now());
  return Response.json({ newlyUnlocked });
}
