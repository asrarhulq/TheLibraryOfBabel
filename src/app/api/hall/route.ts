import { NextRequest } from 'next/server';
import { getPublicDeclarations } from '@/lib/db/declarations';
import { getRecentGlobalDiscoveries, getDailyChamberInfo } from '@/lib/db/travelerData';

export async function GET(_request: NextRequest) {
  try {
    const [declarations, discoveries, daily] = await Promise.all([
      getPublicDeclarations(6),
      getRecentGlobalDiscoveries(6),
      Promise.resolve(getDailyChamberInfo()),
    ]);

    return Response.json({ declarations, discoveries, daily });
  } catch {
    return Response.json({ declarations: [], discoveries: [], daily: null });
  }
}