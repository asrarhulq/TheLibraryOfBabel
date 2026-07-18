import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/mongodb';

interface TravelerName {
  name: string;
  score: number;
  chambersVisited: number;
}

// GET — return all traveler names for the floating display on the home page
export async function GET(_req: NextRequest) {
  try {
    const db = await getDb();
    const col = db.collection('travelers');
    const docs = await col
      .find(
        { name: { $ne: 'Anonymous Traveler' } },
        { projection: { name: 1, score: 1, chambersVisited: 1, _id: 0 } }
      )
      .sort({ score: -1 })
      .limit(200)
      .toArray();
    return Response.json({
      travelers: docs.map((d: Record<string, unknown>) => ({
        name: d.name,
        score: d.score,
        chambersVisited: d.chambersVisited,
      })) as TravelerName[],
    });
  } catch {
    return Response.json({ travelers: [] });
  }
}