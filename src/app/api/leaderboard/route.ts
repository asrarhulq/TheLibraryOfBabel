import { getOwnershipLeaderboard } from '@/lib/db/claims';

export async function GET() {
  const owners = await getOwnershipLeaderboard(25);
  return Response.json({ owners });
}
