import { NextRequest } from 'next/server';
import { getDeclaration } from '@/lib/db/declarations';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  const declaration = await getDeclaration(id);
  if (!declaration) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ declaration });
}
