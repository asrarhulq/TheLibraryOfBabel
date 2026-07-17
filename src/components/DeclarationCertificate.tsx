'use client';

import React, { forwardRef } from 'react';
import { DeclarationDoc } from '@/lib/babel/types';

const KIND_EYEBROW: Record<string, string> = {
  love: 'Immortalized in the Infinite Library',
  future: 'A message left for the future',
  anniversary: 'A moment, kept forever',
};

// The visual certificate. `forwardRef` so callers can render it to a PNG.
const DeclarationCertificate = forwardRef<HTMLDivElement, { d: DeclarationDoc }>(
  function DeclarationCertificate({ d }, ref) {
    const address = `${d.coord.roomId} · wall ${d.coord.wall} · shelf ${d.coord.shelf} · book ${d.coord.book} · page ${d.coord.page}`;

    // The headline differs by kind.
    let headline: React.ReactNode;
    if (d.kind === 'love') {
      headline = (
        <>
          <span className="text-babel-parchment">{d.from}</span>
          <span className="text-babel-gold"> loves </span>
          <span className="text-babel-parchment">{d.to}</span>
        </>
      );
    } else if (d.kind === 'anniversary') {
      headline = <span className="text-babel-parchment">{d.dateLabel || d.phrase}</span>;
    } else {
      headline = <span className="text-babel-parchment">A letter to the future</span>;
    }

    return (
      <div
        ref={ref}
        className="w-full max-w-md mx-auto aspect-[4/5] bg-gradient-to-b from-[#14151b] to-[#0a0a0c] border border-babel-gold/40 p-8 md:p-10 flex flex-col justify-between font-mono relative overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(212,175,55,0.15)' }}
      >
        {/* faint character wash */}
        <div className="absolute inset-0 opacity-[0.04] text-[10px] leading-3 break-all select-none pointer-events-none p-2">
          {'abcdefghijklmnopqrstuvwxyz, .'.repeat(200)}
        </div>

        <div className="relative">
          <p className="text-babel-gold/70 text-[10px] tracking-[0.3em] uppercase mb-1">
            The Infinite Library of Babel
          </p>
          <div className="h-px bg-babel-gold/30 w-full mb-6" />
          <p className="text-babel-dust text-[11px] tracking-widest uppercase mb-4">
            {KIND_EYEBROW[d.kind]}
          </p>
          <p className="font-serif text-2xl md:text-3xl leading-tight mb-4">{headline}</p>
          {d.message && (
            <p className="font-serif italic text-babel-parchment/80 text-sm md:text-base leading-relaxed">
              &ldquo;{d.message}&rdquo;
            </p>
          )}
        </div>

        <div className="relative">
          <p className="text-babel-dust/60 text-[10px] tracking-widest uppercase mb-1">
            Written forever at
          </p>
          <p className="text-babel-gold/90 text-xs break-all leading-relaxed">{address}</p>
          <div className="h-px bg-babel-gold/20 w-full my-4" />
          <p className="text-babel-dust/50 text-[10px] italic leading-relaxed">
            In a library of every possible text, these words were always here — waiting to be found.
          </p>
        </div>
      </div>
    );
  }
);

export default DeclarationCertificate;
