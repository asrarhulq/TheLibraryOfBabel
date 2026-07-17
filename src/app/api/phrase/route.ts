import { NextRequest } from 'next/server';
import { recordPhrase } from '@/lib/db/travelerData';
import { travelerIdFrom, parseCoord } from '../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const phrase = typeof body?.phrase === 'string' ? body.phrase : '';
  if (!phrase.trim()) return Response.json({ error: 'Empty phrase' }, { status: 400 });
  const name = (typeof body?.name === 'string' ? body.name : 'Anonymous Traveler').slice(0, 40);
  const newlyUnlocked = await recordPhrase(travelerId, name, phrase, coord, Date.now());
  return Response.json({ newlyUnlocked });
}
