import { NextRequest } from 'next/server';
import { getRarityCollection, getWordBadgeCollection } from '@/lib/db/travelerData';
import { travelerIdFrom } from '../_util';

export async function GET(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ collections: [], wordBadges: [] });

  const [collections, wordBadges] = await Promise.all([
    getRarityCollection(travelerId),
    getWordBadgeCollection(travelerId),
  ]);

  return Response.json({ collections, wordBadges });
}