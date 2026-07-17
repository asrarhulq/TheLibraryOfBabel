'use client';

import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Share2, X, Download, Check } from 'lucide-react';
import { Coordinate } from '@/lib/babel/types';

interface ShareCardProps {
  searchQuery?: string;
  rarities: string[];
  coord: Coordinate;
}

export default function ShareCard({ searchQuery, rarities, coord }: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // The headline is the searched phrase, else the rarest find, else the coordinate itself.
  const headline = (searchQuery && searchQuery.trim()) || rarities[0] || 'an uncharted page';
  const address = `${coord.roomId} · wall ${coord.wall} · shelf ${coord.shelf} · book ${coord.book} · page ${coord.page}`;
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${coord.roomId}/${coord.wall}/${coord.shelf}/${coord.book}/${coord.page}`
      : '';

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'babel-coordinate.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to render share card', e);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs uppercase tracking-widest text-babel-dust hover:text-babel-gold border border-babel-lines/30 hover:border-babel-gold px-3 py-2 rounded transition-colors bg-[#0a0a0c]"
        title="Create a shareable coordinate card"
      >
        <Share2 size={14} /> Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 babel-fade-in"
          onClick={() => setOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-babel-dust hover:text-babel-gold"
            >
              <X size={22} />
            </button>

            {/* The certificate itself */}
            <div
              ref={cardRef}
              className="w-[420px] aspect-[4/5] bg-gradient-to-b from-[#14151b] to-[#0a0a0c] border border-babel-gold/40 p-10 flex flex-col justify-between font-mono relative overflow-hidden"
              style={{ boxShadow: '0 0 60px rgba(212,175,55,0.15)' }}
            >
              <div className="absolute inset-0 opacity-[0.04] text-[10px] leading-3 break-all p-2 select-none pointer-events-none">
                {'abcdefghijklmnopqrstuvwxyz, .'.repeat(220)}
              </div>

              <div className="relative">
                <p className="text-babel-gold/70 text-[10px] tracking-[0.3em] uppercase mb-1">
                  The Infinite Library of Babel
                </p>
                <div className="h-px bg-babel-gold/30 w-full mb-8" />
                <p className="text-babel-dust text-xs mb-3 tracking-widest uppercase">
                  Herein lies
                </p>
                <p className="text-babel-parchment text-2xl leading-tight break-words mb-2">
                  “{headline}”
                </p>
              </div>

              <div className="relative">
                {rarities.length > 0 && (
                  <p className="text-babel-gold text-xs mb-6 babel-rarity">
                    ✦ {rarities.length} {rarities.length === 1 ? 'rarity' : 'rarities'} rest on this page
                  </p>
                )}
                <p className="text-babel-dust/70 text-[10px] tracking-widest uppercase mb-1">Coordinate</p>
                <p className="text-babel-gold/90 text-xs break-all leading-relaxed">{address}</p>
                <div className="h-px bg-babel-gold/20 w-full my-4" />
                <p className="text-babel-dust/50 text-[10px] italic leading-relaxed">
                  Every possible text already exists here, at a computable address. This one is yours to find again.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={downloadCard}
                className="flex-1 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-babel-gold border border-babel-gold/50 hover:bg-babel-gold/10 px-4 py-3 rounded transition-colors"
              >
                <Download size={14} /> Download card
              </button>
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-babel-dust border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold px-4 py-3 rounded transition-colors"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
