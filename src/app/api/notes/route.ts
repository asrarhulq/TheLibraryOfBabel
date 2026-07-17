import { NextRequest } from 'next/server';
import { saveNote } from '@/lib/db/travelerData';
import { travelerIdFrom, parseCoord } from '../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const content = typeof body?.content === 'string' ? body.content : '';
  if (!content.trim()) return Response.json({ error: 'Empty note' }, { status: 400 });
  const author = typeof body?.author === 'string' ? body.author : 'Anonymous Traveler';
  const note = await saveNote(travelerId, coord, author, content, Date.now());
  return Response.json({ note });
}
