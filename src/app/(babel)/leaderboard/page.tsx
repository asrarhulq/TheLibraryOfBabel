'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';

interface OwnerRank {
  owner: string;
  count: number;
  latest: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [owners, setOwners] = useState<OwnerRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (!cancelled && data?.owners) setOwners(data.owners as OwnerRank[]);
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
      <div className="max-w-2xl mx-auto p-5 sm:p-8 md:p-10 babel-rise-in">
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm font-mono mb-8">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
          Keepers of the Library
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-babel-gold font-mono tracking-widest uppercase mb-4 babel-breathe flex items-center gap-3">
          <Crown size={26} /> Leaderboard
        </h1>
        <p className="text-babel-parchment/80 font-serif italic text-base md:text-lg leading-relaxed mb-10">
          Those who hold the most chambers of the infinite Library.
        </p>

        {loading ? (
          <p className="text-babel-dust animate-pulse font-mono">Counting the keepers…</p>
        ) : owners.length === 0 ? (
          <div className="text-center py-16 border border-babel-lines/20 rounded">
            <p className="text-babel-dust italic font-serif mb-4">No chambers have been claimed yet.</p>
            <p className="text-babel-dust/60 text-sm font-mono">Be the first keeper — claim a chamber inside any room.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {owners.map((o, i) => (
              <li
                key={`${o.owner}-${i}`}
                className={`flex items-center gap-4 p-4 rounded border ${
                  i < 3
                    ? 'border-babel-gold/40 bg-babel-gold/5'
                    : 'border-babel-lines/20 bg-black/20'
                }`}
              >
                <span className="text-xl w-8 text-center shrink-0 font-mono tabular-nums">
                  {MEDAL[i] || `${i + 1}`}
                </span>
                <span className="flex-1 font-serif text-lg text-babel-parchment truncate">{o.owner}</span>
                <span className="text-babel-gold font-mono text-sm tabular-nums shrink-0">
                  {o.count} {o.count === 1 ? 'chamber' : 'chambers'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
