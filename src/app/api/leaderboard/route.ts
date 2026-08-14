import { getOwnershipLeaderboard } from '@/lib/db/claims';

export async function GET() {
  const owners = await getOwnershipLeaderboard(25);
  return Response.json(
    { owners },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
