import { getPublicDeclarations } from '@/lib/db/declarations';

export async function GET() {
  const declarations = await getPublicDeclarations(40);
  return Response.json({ declarations });
}
