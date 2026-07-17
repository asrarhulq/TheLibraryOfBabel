import { NextRequest } from 'next/server';
import { searchForText } from '@/lib/babel/server/generatorCore';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === 'string' ? body.query : '';
  if (!query.trim()) {
    return Response.json({ error: 'Query must contain valid characters.' }, { status: 400 });
  }
  try {
    const loc = searchForText(query);
    const roomId = `${loc.x}-${loc.y}-${loc.z}`;
    return Response.json({ roomId, ...loc });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Search failed.' },
      { status: 400 }
    );
  }
}
