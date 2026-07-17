import { NextRequest } from 'next/server';
import { getNotes } from '@/lib/db/travelerData';
import { parseCoord } from '../../_util';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const notes = await getNotes(coord);
  return Response.json({ notes });
}
