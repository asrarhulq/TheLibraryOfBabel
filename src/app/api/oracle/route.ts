import { NextRequest } from 'next/server';
import { searchForText } from '@/lib/babel/server/generatorCore';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question : '';
  if (!question.trim()) {
    return Response.json({ error: 'Ask something, traveler.' }, { status: 400 });
  }
  try {
    const loc = searchForText(question);
    const roomId = `${loc.x}-${loc.y}-${loc.z}`;
    return Response.json({ roomId, ...loc });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'The Library could not divine an answer.' },
      { status: 400 }
    );
  }
}