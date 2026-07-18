'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, Mail } from 'lucide-react';
import { ClaimDoc } from '@/lib/babel/types';
import { getTravelerId } from '@/lib/traveler/client';

interface Props {
  roomId: string;
  initialClaim: ClaimDoc | null;
  price: number; // cents
  currency: string;
  live: boolean;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100
  );
}

export default function ClaimChamber({ roomId, initialClaim, price, currency, live }: Props) {
  const [claim, setClaim] = useState<ClaimDoc | null>(initialClaim);
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState('');
  const [dedication, setDedication] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => setMounted(true), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-traveler-id': getTravelerId() },
        body: JSON.stringify({ roomId, owner, dedication }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not complete the claim.');
      } else if (data.mode === 'live' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // to Stripe
        return;
      } else if (data.claim) {
        setClaim(data.claim as ClaimDoc);
        setOpen(false);
      }
    } catch {
      setError('Could not reach the Library.');
    } finally {
      setBusy(false);
    }
  };

  // ── Claimed: show the ownership plaque ──────────────────────────────────────
  if (claim) {
    return (
      <div className="border border-babel-gold/40 bg-babel-gold/5 rounded p-4 flex items-start gap-3">
        <Crown size={18} className="text-babel-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-babel-gold/70 mb-1">
            This chamber belongs to
          </p>
          <p className="text-babel-gold font-mono text-base">{claim.owner}</p>
          {claim.dedication && (
            <p className="text-babel-parchment/70 text-sm italic font-serif mt-1">
              &ldquo;{claim.dedication}&rdquo;
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Unclaimed: the CTA ──────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-babel-lines/40 hover:border-babel-gold bg-black/20 hover:bg-babel-gold/5 rounded p-4 flex items-center gap-3 text-left transition-colors group"
      >
        <Crown size={18} className="text-babel-dust group-hover:text-babel-gold shrink-0 transition-colors" />
        <div>
          <p className="text-babel-parchment text-sm">Claim this chamber</p>
          <p className="text-babel-dust text-xs">
            {live ? `Own it forever · ${formatPrice(price, currency)}` : 'Own it forever · enquire'}
          </p>
        </div>
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 babel-fade-in"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-md bg-babel-wall/95 border border-babel-gold/40 rounded-sm shadow-[0_0_60px_rgba(212,175,55,0.15)] p-8 babel-rise-in">
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 text-babel-dust hover:text-babel-gold">
              <X size={20} />
            </button>

            <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
              Claim a Coordinate
            </p>
            <h3 className="text-xl text-babel-gold font-mono tracking-widest uppercase mb-2">
              Own this chamber
            </h3>
            <p className="text-babel-parchment/70 text-sm font-serif italic leading-relaxed mb-6">
              One of infinite rooms — but only one person can hold this exact address. Your name will
              rest on it, for everyone who ever finds their way here.
            </p>

            {!live ? (
              // Purchasing isn't open yet — direct them to get in touch.
              <div className="flex flex-col gap-4">
                <div className="border border-babel-gold/30 bg-babel-gold/5 rounded p-4 text-center">
                  <p className="text-babel-gold text-sm font-mono tracking-widest uppercase mb-2">
                    Claiming opens soon
                  </p>
                  <p className="text-babel-parchment/70 text-sm leading-relaxed">
                    Chambers can&rsquo;t be claimed just yet. To reserve this exact coordinate or ask
                    about owning a chamber, reach out and we&rsquo;ll arrange it.
                  </p>
                </div>
                <a
                  href={`mailto:contact@thelibrary.page?subject=${encodeURIComponent(
                    `Claim chamber ${roomId}`
                  )}&body=${encodeURIComponent(
                    `I'd like to claim the chamber at ${roomId}.\n\nName for the plaque:\nDedication (optional):`
                  )}`}
                  className="w-full flex items-center justify-center gap-2 bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest font-mono"
                >
                  <Mail size={15} /> Contact to claim
                </a>
                <p className="text-babel-dust/50 text-[11px] text-center">
                  contact@thelibrary.page
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  maxLength={60}
                  required
                  placeholder="Name for the plaque"
                  className="w-full bg-black/50 border border-babel-lines/50 p-3 text-babel-parchment focus:outline-none focus:border-babel-gold transition-colors placeholder:text-babel-dust/60"
                />
                <input
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  maxLength={140}
                  placeholder="A dedication (optional)"
                  className="w-full bg-black/50 border border-babel-lines/50 p-3 text-babel-parchment focus:outline-none focus:border-babel-gold transition-colors placeholder:text-babel-dust/60"
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest font-mono disabled:opacity-50 mt-2"
                >
                  {busy ? 'Sealing…' : `Claim · ${formatPrice(price, currency)}`}
                </button>
                <p className="text-babel-dust/50 text-[11px] text-center leading-relaxed">
                  By claiming you agree to the{' '}
                  <a href="/terms" className="text-babel-gold/80 hover:underline">Terms</a> and{' '}
                  <a href="/refunds" className="text-babel-gold/80 hover:underline">Refund Policy</a>.
                  All claims are final.
                </p>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
