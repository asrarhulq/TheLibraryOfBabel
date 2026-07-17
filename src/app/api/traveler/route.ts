import { NextRequest } from 'next/server';
import { getOrCreateTraveler } from '@/lib/db/travelerData';
import { travelerIdFrom } from '../_util';

export async function GET(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const stats = await getOrCreateTraveler(travelerId, Date.now());
  return Response.json({ stats });
}
