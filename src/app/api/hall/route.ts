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

    return Response.json(
      { declarations, discoveries, daily },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch {
    return Response.json(
      { declarations: [], discoveries: [], daily: null },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  }
}