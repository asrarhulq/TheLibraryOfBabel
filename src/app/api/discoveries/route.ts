import { NextRequest } from 'next/server';
import { getRecentDiscoveries } from '@/lib/db/travelerData';
import { travelerIdFrom } from '../_util';

// Personal: returns only the requesting traveler's own saved discoveries.
export async function GET(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ discoveries: [] });
  const discoveries = await getRecentDiscoveries(travelerId, 20);
  return Response.json({ discoveries });
}
