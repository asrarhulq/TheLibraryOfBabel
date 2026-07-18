import { NextRequest } from 'next/server';
import { getClaimsByTraveler } from '@/lib/db/claims';
import { travelerIdFrom } from '../../_util';

export async function GET(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ claims: [] });
  const claims = await getClaimsByTraveler(travelerId);
  return Response.json({ claims });
}