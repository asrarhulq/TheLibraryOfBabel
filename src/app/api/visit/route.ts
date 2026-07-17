import { NextRequest } from 'next/server';
import { recordVisit } from '@/lib/db/travelerData';
import { travelerIdFrom, parseCoord } from '../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const result = await recordVisit(travelerId, coord, Date.now(), {
    isDailyChamber: Boolean(body?.isDailyChamber),
  });
  return Response.json(result);
}
