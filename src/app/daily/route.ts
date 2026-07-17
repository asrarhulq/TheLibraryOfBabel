import { NextResponse } from 'next/server';
import { getDailyChamber } from '@/lib/babel/daily';

// Computes today's shared chamber at request time and redirects into it.
// Kept as a route (not inline in the Navbar) so the date is read per-request on the
// server, never frozen into a statically-rendered layout.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const daily = getDailyChamber(Date.now());
  return NextResponse.redirect(new URL(daily.path, request.url));
}
