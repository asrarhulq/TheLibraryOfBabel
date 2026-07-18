'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Clock, CalendarHeart, Sparkles, Plus } from 'lucide-react';
import { DeclarationDoc } from '@/lib/babel/types';

const KIND_ICON: Record<string, React.ReactNode> = {
  love: <Heart size={14} />,
  future: <Clock size={14} />,
  anniversary: <CalendarHeart size={14} />,
  other: <Sparkles size={14} />,
};

const KIND_LABEL: Record<string, string> = {
  love: 'A love',
  future: 'To the future',
  anniversary: 'A moment',
  other: 'Immortalized',
};

function headline(d: DeclarationDoc): string {
  if (d.kind === 'love') return `${d.from} loves ${d.to}`;
  if (d.kind === 'anniversary') return d.dateLabel || d.phrase;
  if (d.kind === 'future') return 'A letter to the future';
  return d.message || d.phrase || 'These words, forever';
}

export default function WallPage() {
  const [items, setItems] = useState<DeclarationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/declare/wall');
        const data = await res.json();
        if (!cancelled && data?.declarations) setItems(data.declarations as DeclarationDoc[]);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment">
      <div className="max-w-3xl mx-auto p-6 md:p-10 babel-rise-in">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm font-mono">
            <ArrowLeft size={16} /> Exit to Void
          </Link>
          <Link href="/immortalize" className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-babel-gold border border-babel-gold/50 hover:bg-babel-gold/10 px-3 py-2 rounded transition-colors">
            <Plus size={14} /> Add yours
          </Link>
        </div>

        <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
          Public
        </p>
        <h1 className="text-3xl md:text-4xl text-babel-gold font-mono tracking-widest uppercase mb-4 babel-breathe">
          Wall of Declarations
        </h1>
        <p className="text-babel-parchment/80 font-serif italic text-base md:text-lg leading-relaxed mb-10">
          Words that travelers chose to share with the world — each one found at its own eternal
          address in the Library.
        </p>

        {loading ? (
          <p className="text-babel-dust animate-pulse font-mono">Gathering declarations…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 border border-babel-lines/20 rounded">
            <p className="text-babel-dust italic font-serif mb-4">No public declarations yet.</p>
            <Link href="/immortalize" className="text-babel-gold hover:underline text-sm font-mono uppercase tracking-widest">
              Be the first →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((d) => (
              <Link
                key={d.id}
                href={`/d/${d.id}`}
                className="block bg-black/30 hover:bg-black/50 border border-babel-lines/20 hover:border-babel-gold/40 rounded p-5 transition-all group"
              >
                <div className="flex items-center gap-2 text-babel-gold/70 text-[10px] uppercase tracking-widest mb-3">
                  {KIND_ICON[d.kind]}
                  <span>{KIND_LABEL[d.kind] || 'Immortalized'}</span>
                </div>
                <p className="font-serif text-lg text-babel-parchment mb-2 leading-snug">
                  {headline(d)}
                </p>
                {d.message && (
                  <p className="font-serif italic text-babel-dust/80 text-sm leading-relaxed line-clamp-3">
                    &ldquo;{d.message}&rdquo;
                  </p>
                )}
                <p className="text-[10px] text-babel-lines group-hover:text-babel-gold transition-colors mt-3 font-mono">
                  {d.coord.roomId} →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
