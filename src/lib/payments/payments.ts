// Payment abstraction with a clean Stripe integration point.
//
// The entitlement logic (who owns what) is REAL in every mode. Only the money-moving
// step is swapped:
//   • If STRIPE_SECRET_KEY is set  → create a real Stripe Checkout Session and require a
//     confirmed payment before granting the claim.
//   • If it is NOT set (dev/stub)  → "dev grant" mode: the claim is granted immediately so
//     the whole flow is demoable without keys. A banner makes this explicit in the UI.
//
// To go live: `npm i stripe`, set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in .env.local,
// and fill in the two marked TODO blocks. Nothing else changes.

export const CLAIM_PRICE = 200; // $2.00 in cents
export const CLAIM_CURRENCY = 'usd';

export function isLiveMode(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface CheckoutResult {
  mode: 'live' | 'dev';
  // In live mode: the URL to redirect the buyer to (Stripe-hosted checkout).
  checkoutUrl?: string;
  // In dev mode: true means "treat as paid immediately".
  devGranted?: boolean;
}

/**
 * Begin checkout for claiming a room. Returns either a Stripe redirect URL (live)
 * or a dev-grant signal (stub).
 */
export async function beginClaimCheckout(params: {
  roomId: string;
  owner: string;
  origin: string;
}): Promise<CheckoutResult> {
  if (!isLiveMode()) {
    // ── DEV / STUB MODE ──────────────────────────────────────────────────────
    // No real charge; the claim is granted right away so you can demo end-to-end.
    return { mode: 'dev', devGranted: true };
  }

  // ── LIVE MODE (activates when STRIPE_SECRET_KEY is present) ─────────────────
  // TODO to go live:
  //   import Stripe from 'stripe';
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  //   const session = await stripe.checkout.sessions.create({
  //     mode: 'payment',
  //     line_items: [{
  //       price_data: {
  //         currency: CLAIM_CURRENCY,
  //         unit_amount: CLAIM_PRICE,
  //         product_data: { name: `Claim chamber ${params.roomId}` },
  //       },
  //       quantity: 1,
  //     }],
  //     metadata: { roomId: params.roomId, owner: params.owner },
  //     success_url: `${params.origin}/room/${params.roomId}/1/1/1/1?claimed=1`,
  //     cancel_url: `${params.origin}/room/${params.roomId}/1/1/1/1`,
  //   });
  //   return { mode: 'live', checkoutUrl: session.url! };
  //
  // Then verify payment in a Stripe webhook (checkout.session.completed) and only
  // call the claim-granting DB function from there — never trust the client.
  throw new Error('Stripe live mode not yet configured. Add STRIPE_SECRET_KEY and the marked code.');
}
