import { NextRequest } from 'next/server';
import { saveNote } from '@/lib/db/travelerData';
import { parseCoord } from '../_util';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  // Only signed-in users may leave a mark. Identity + display name come from the session,
  // never from the client, so notes can't be forged.
  const session = await auth();
  const user = session?.user as { id?: string; email?: string; name?: string } | undefined;
  if (!user) return Response.json({ error: 'Sign in to leave a mark.' }, { status: 401 });

  const travelerId = 'google:' + (user.id || user.email || '');
  const author = (user.name || 'Traveler').slice(0, 40);

  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });
  const content = typeof body?.content === 'string' ? body.content : '';
  if (!content.trim()) return Response.json({ error: 'Empty note' }, { status: 400 });

  const note = await saveNote(travelerId, coord, author, content, Date.now());
  return Response.json({ note });
}
