import { NextRequest } from 'next/server';
import { setName } from '@/lib/db/travelerData';
import { travelerIdFrom } from '../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name : '';
  const clean = await setName(travelerId, name, Date.now());
  return Response.json({ name: clean });
}
