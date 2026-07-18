import { NextRequest } from 'next/server';
import { mergeTraveler } from '@/lib/db/travelerData';
import { auth } from '@/auth';

// Merge anonymous progress into the signed-in account. Requires a valid session, and the
// target account id must match the signed-in user's own id (no merging into someone else).
export async function POST(request: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; email?: string } | undefined;
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const accountId = 'google:' + (user.id || user.email || '');
  const headerId = request.headers.get('x-traveler-id') || '';
  if (headerId !== accountId) {
    return Response.json({ error: 'Identity mismatch' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const fromId = typeof body?.fromId === 'string' ? body.fromId : '';
  const name = typeof body?.name === 'string' ? body.name : '';
  if (!fromId) return Response.json({ error: 'Missing source id' }, { status: 400 });

  await mergeTraveler(accountId, fromId, name, Date.now());
  return Response.json({ ok: true });
}
