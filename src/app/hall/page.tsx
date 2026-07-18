'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Crown, Heart, ScrollText, Sparkles, ExternalLink,
  BookMarked, MapPin, Users, Clock
} from 'lucide-react';
import { DeclarationDoc, DiscoveryDoc } from '@/lib/babel/types';

interface HallData {
  declarations: DeclarationDoc[];
  discoveries: DiscoveryDoc[];
  daily: { today: string } | null;
}

const KIND_ICON: Record<string, React.ReactNode> = {
  love: <Heart size={12} />,
  future: <Clock size={12} />,
  anniversary: <Heart size={12} />,
  other: <Sparkles size={12} />,
};

function declarationHeadline(d: DeclarationDoc): string {
  if (d.kind === 'love') return `${d.from || 'Someone'} loves ${d.to || 'someone'}`;
  if (d.kind === 'anniversary') return d.dateLabel || d.phrase;
  if (d.kind === 'future') return 'A letter to the future';
  return d.message || d.phrase || 'These words, forever';
}

export default function HallPage() {
  const [data, setData] = useState<HallData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/hall');
        const json = await res.json();
        if (!cancelled) setData(json as HallData);
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
      <div className="max-w-4xl mx-auto p-6 md:p-10 babel-rise-in">
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm font-mono mb-8">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        <div className="text-center mb-12">
          <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
            The Great Hall
          </p>
          <h1 className="text-3xl md:text-4xl text-babel-gold font-mono tracking-widest uppercase mb-4 babel-breathe flex items-center justify-center gap-3">
            <Users size={30} /> The Great Hall
          </h1>
          <p className="text-babel-parchment/80 font-serif italic text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            A gathering place for travelers of the infinite Library. See what others have found,
            declared, and claimed.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-babel-dust animate-pulse font-mono">Opening the great doors…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Chamber */}
            <div className="lg:col-span-2 bg-black/30 border border-babel-gold/30 rounded p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left flex-1">
                <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-1 font-mono">
                  <Sparkles size={10} className="inline mr-1" /> Daily Chamber
                </p>
                <p className="text-babel-gold font-mono text-lg tracking-widest">
                  Visit today's chamber — a new room every day
                </p>
                <p className="text-babel-dust/60 text-xs mt-1">
                  {data?.daily?.today ? `Today: ${data.daily.today}` : 'A fresh chamber awaits'}
                </p>
              </div>
              <Link
                href="/daily"
                className="shrink-0 flex items-center gap-2 bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold px-5 py-3 transition-all uppercase tracking-widest font-mono text-sm rounded"
              >
                Enter <ExternalLink size={14} />
              </Link>
            </div>

            {/* Recent Declarations */}
            <div className="bg-black/30 border border-babel-lines/20 rounded p-6">
              <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                <Heart size={16} /> Recent Declarations
              </h2>
              {data?.declarations && data.declarations.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.declarations.slice(0, 4).map((d) => (
                    <Link
                      key={d.id}
                      href={`/d/${d.id}`}
                      className="flex items-start gap-3 p-3 rounded border border-babel-lines/10 hover:border-babel-gold/40 hover:bg-babel-gold/5 transition-all group"
                    >
                      <span className="text-babel-gold/60 shrink-0 mt-0.5">
                        {KIND_ICON[d.kind] || <Sparkles size={12} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-babel-parchment text-sm font-serif group-hover:text-babel-gold transition-colors truncate">
                          {declarationHeadline(d)}
                        </p>
                        <p className="text-babel-dust/50 text-[10px] mt-0.5 font-mono">
                          {d.coord.roomId}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-babel-dust/60 text-sm italic">No public declarations yet.</p>
              )}
              <Link href="/wall" className="inline-flex items-center gap-1 text-babel-gold/70 hover:text-babel-gold text-xs uppercase tracking-widest mt-4 transition-colors">
                View all <ScrollText size={12} />
              </Link>
            </div>

            {/* Recent Discoveries */}
            <div className="bg-black/30 border border-babel-lines/20 rounded p-6">
              <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                <BookMarked size={16} /> Saved by Travelers
              </h2>
              {data?.discoveries && data.discoveries.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.discoveries.slice(0, 4).map((d, i) => (
                    <Link
                      key={`${d.coord.roomId}-${d.coord.page}-${i}`}
                      href={`/room/${d.coord.roomId}/${d.coord.wall}/${d.coord.shelf}/${d.coord.book}/${d.coord.page}`}
                      className="flex items-start gap-3 p-3 rounded border border-babel-lines/10 hover:border-babel-gold/40 hover:bg-babel-gold/5 transition-all group"
                    >
                      <MapPin size={14} className="text-babel-gold/60 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-babel-parchment text-sm group-hover:text-babel-gold transition-colors truncate">
                          {d.name} saved: {d.label || d.text || 'a page'}
                        </p>
                        <p className="text-babel-dust/50 text-[10px] mt-0.5 font-mono">
                          {d.coord.roomId} · p.{d.coord.page}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-babel-dust/60 text-sm italic">No saved pages shared yet.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/search"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <Sparkles size={22} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Search</span>
              </Link>
              <Link
                href="/oracle"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🔮</span>
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Oracle</span>
              </Link>
              <Link
                href="/immortalize"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <Heart size={22} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Immortalize</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <Crown size={22} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Keepers</span>
              </Link>
            </div>

            {/* Borges quote */}
            <div className="lg:col-span-2 text-center mt-4 pb-4">
              <p className="text-babel-dust/40 text-xs italic font-serif leading-relaxed">
                &ldquo;The Library is unlimited and cyclical. If an eternal traveler were to cross it in any
                direction, he would see after centuries that the same volumes are repeated in the same
                disorder — which, repeated, would be an order: the Order.&rdquo;
              </p>
              <p className="text-babel-dust/30 text-[10px] mt-2 uppercase tracking-widest">
                — Jorge Luis Borges, The Library of Babel
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}