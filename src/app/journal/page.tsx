'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Pencil } from 'lucide-react';
import { travelerApi, getLocalName, setLocalName, initSession, isSignedIn } from '@/lib/traveler/client';
import { ACHIEVEMENTS, TravelerStats } from '@/lib/babel/types';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-black/30 border border-babel-lines/20 rounded p-5 text-center">
      <div className="text-3xl md:text-4xl text-babel-gold font-mono babel-fade-in">{value}</div>
      <div className="text-[10px] md:text-xs text-babel-dust uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}

export default function JournalPage() {
  const [stats, setStats] = useState<TravelerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(() => getLocalName() || '');

  const [signedIn, setSignedIn] = useState(false);

  const load = async () => {
    const res = await travelerApi.stats();
    if (res?.stats) setStats(res.stats as TravelerStats);
    setLoading(false);
  };

  useEffect(() => {
    // Resolve the session first so stats load under the right identity (account vs anon).
    (async () => {
      await initSession();
      setSignedIn(isSignedIn());
      setNameInput(getLocalName() || '');
      await load();
    })();
  }, []);

  const saveName = async () => {
    const clean = nameInput.trim().slice(0, 40);
    setLocalName(clean);
    await travelerApi.setName(clean);
    setEditingName(false);
    load();
  };

  const unlocked = new Set(stats?.achievements || []);

  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment font-mono">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        {/* Identity */}
        <div className="mb-10">
          <p className="text-babel-dust text-xs tracking-widest uppercase mb-2">Seeker&apos;s Journal</p>
          {signedIn ? (
            // Signed in — name comes from Google, not editable here.
            <div className="text-3xl md:text-4xl text-babel-gold tracking-wide">
              {stats?.name || getLocalName() || 'Traveler'}
            </div>
          ) : editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                maxLength={40}
                placeholder="Name yourself, traveler…"
                className="bg-black/50 border border-babel-gold/40 focus:border-babel-gold outline-none px-3 py-2 text-2xl text-babel-parchment rounded"
              />
              <button onClick={saveName} className="text-babel-gold border border-babel-gold/50 rounded p-2 hover:bg-babel-gold/10">
                <Check size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="group flex items-center gap-3 text-3xl md:text-4xl text-babel-gold tracking-wide"
            >
              {stats?.name || 'Anonymous Traveler'}
              <Pencil size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <p className="text-babel-dust/60 text-xs mt-2 italic">
            {signedIn
              ? 'Signed in — your progress follows you across devices.'
              : stats?.name && stats.name !== 'Anonymous Traveler'
                ? 'Your name may already lie hidden somewhere in the stacks…'
                : 'Name yourself to hunt for your own name embedded in the void.'}
          </p>
        </div>

        {loading ? (
          <p className="text-babel-dust animate-pulse">Consulting the ledger…</p>
        ) : (
          <>
            {/* Score banner */}
            <div className="mb-8 flex flex-wrap items-end gap-x-8 gap-y-3 border-b border-babel-lines/20 pb-8">
              <div>
                <div className="text-5xl md:text-6xl text-babel-gold font-mono babel-fade-in">
                  {stats?.score ?? 0}
                </div>
                <div className="text-xs text-babel-dust uppercase tracking-widest mt-1">Seeker points</div>
              </div>
              <div className="flex items-center gap-2 text-babel-parchment/80">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-xl text-babel-gold">{stats?.visitStreak ?? 0} day streak</div>
                  <div className="text-[10px] text-babel-dust uppercase tracking-widest">
                    longest: {stats?.longestStreak ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              <Stat label="Chambers Visited" value={stats?.chambersVisited ?? 0} />
              <Stat label="Pages Read" value={stats?.pagesRead ?? 0} />
              <Stat label="Words Uncovered" value={stats?.wordsUncovered ?? 0} />
              <Stat label="Rare Finds ✦" value={stats?.rareFinds ?? 0} />
              <Stat label="Phrases Sought" value={stats?.phrasesSought ?? 0} />
              <Stat
                label="Achievements"
                value={`${unlocked.size} / ${ACHIEVEMENTS.length}`}
              />
            </div>

            {/* Achievements */}
            <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4">Achievements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((a) => {
                const has = unlocked.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-4 p-4 rounded border transition-colors ${
                      has
                        ? 'border-babel-gold/50 bg-babel-gold/5'
                        : 'border-babel-lines/20 bg-black/20 opacity-50'
                    }`}
                  >
                    <span className={`text-2xl ${has ? '' : 'grayscale'}`}>{has ? a.icon : '🔒'}</span>
                    <div>
                      <p className={`text-sm ${has ? 'text-babel-gold' : 'text-babel-dust'}`}>{a.title}</p>
                      <p className="text-xs text-babel-dust/70 leading-snug">{a.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
