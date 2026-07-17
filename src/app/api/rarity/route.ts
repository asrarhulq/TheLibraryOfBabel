import { NextRequest } from 'next/server';
import { recordRarity } from '@/lib/db/travelerData';
import { travelerIdFrom, parseCoord } from '../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const r = body?.rarity;
  if (!r || typeof r.text !== 'string' || typeof r.kind !== 'string') {
    return Response.json({ error: 'Bad rarity' }, { status: 400 });
  }
  const rarity = {
    kind: r.kind,
    text: r.text.slice(0, 100),
    weight: Math.max(1, Math.min(5, Number(r.weight) || 1)),
  };
  const name = (typeof body?.name === 'string' ? body.name : 'Anonymous Traveler').slice(0, 40);
  const result = await recordRarity(travelerId, name, coord, rarity, Date.now());
  return Response.json(result);
}
