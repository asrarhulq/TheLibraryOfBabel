import { NextRequest } from 'next/server';
import { getClaim, grantClaim } from '@/lib/db/claims';
import { beginClaimCheckout, CLAIM_PRICE, CLAIM_CURRENCY, isLiveMode } from '@/lib/payments/payments';

// GET /api/claim?roomId=...  → current claim status + pricing.
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId') || '';
  const claim = await getClaim(roomId);
  return Response.json({
    claim,
    price: CLAIM_PRICE,
    currency: CLAIM_CURRENCY,
    live: isLiveMode(),
  });
}

// POST /api/claim  → begin a claim. Dev mode grants immediately; live mode returns a
// Stripe checkout URL (and the claim is granted later by the verified webhook).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const roomId = typeof body?.roomId === 'string' ? body.roomId : '';
  const owner = typeof body?.owner === 'string' ? body.owner.trim() : '';
  const dedication = typeof body?.dedication === 'string' ? body.dedication.trim() : '';
  const travelerId = request.headers.get('x-traveler-id') || undefined;
  const origin = request.nextUrl.origin;

  if (!roomId) return Response.json({ error: 'Missing room.' }, { status: 400 });
  if (!owner) return Response.json({ error: 'Please enter a name for the plaque.' }, { status: 400 });

  const existing = await getClaim(roomId);
  if (existing) return Response.json({ error: 'This chamber is already claimed.' }, { status: 409 });

  const checkout = await beginClaimCheckout({ roomId, owner, origin });

  if (checkout.mode === 'live') {
    // Payment happens on Stripe; the webhook grants the claim after settlement.
    return Response.json({ mode: 'live', checkoutUrl: checkout.checkoutUrl });
  }

  // Dev/stub mode: grant immediately so the flow is fully demoable.
  const result = await grantClaim({ roomId, owner, dedication, travelerId }, Date.now());
  if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
  return Response.json({ mode: 'dev', claim: result.claim });
}
