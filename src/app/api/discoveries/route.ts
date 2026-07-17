import { getRecentDiscoveries } from '@/lib/db/travelerData';

export async function GET() {
  const discoveries = await getRecentDiscoveries(15);
  return Response.json({ discoveries });
}
