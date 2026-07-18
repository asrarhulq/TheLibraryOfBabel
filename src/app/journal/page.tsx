'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Pencil, Bookmark, ExternalLink, Home, Gem, Star, Swords, HeartHandshake, LetterText, Flame } from 'lucide-react';
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

interface DiscoveryItem {
  _id?: string;
  travelerId?: string;
  name: string;
  label?: string;
  coord: { roomId: string; wall: number; shelf: number; book: number; page: number };
  rarities?: { kind: string; text: string; weight: number }[];
  timestamp: number;
}

interface ClaimItem {
  roomId: string;
  owner: string;
  dedication?: string;
  claimedAt: number;
}

const RARITY_BADGE_DEFS: { kind: string; label: string; icon: React.ReactNode; description: string }[] = [
  { kind: 'long-word', label: 'Long Words', icon: <LetterText size={16} />, description: 'Uncover words 5+ letters long in the void' },
  { kind: 'palindrome', label: 'Palindromes', icon: <Swords size={16} />, description: 'Words that read the same forwards and backwards' },
  { kind: 'word-chain', label: 'Word Chains', icon: <Flame size={16} />, description: 'Three or more real words in a row' },
  { kind: 'your-name', label: 'Namesake', icon: <HeartHandshake size={16} />, description: 'Your own name, hidden in the stacks' },
];

// Alphabet rarity badges: a-z
const ALPHABET_GRID = 'abcdefghijklmnopqrstuvwxyz'.split('');

function RarityBadges() {
  const [collections, setCollections] = useState<{ kind: string; count: number; latest: number }[]>([]);
  const [wordBadges, setWordBadges] = useState<string[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await travelerApi.badges();
      if (!cancelled && res) {
        setCollections(res.collections || []);
        setWordBadges(res.wordBadges || []);
      }
      if (!cancelled) setBadgesLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (badgesLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
          <Gem size={16} /> Rarity Collections
        </h2>
        <p className="text-babel-dust/60 text-xs animate-pulse">Assembling your collection…</p>
      </div>
    );
  }

  const hasAny = collections.length > 0 || wordBadges.length > 0;
  if (!hasAny) {
    return (
      <div className="mb-12">
        <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
          <Gem size={16} /> Rarity Collections
        </h2>
        <p className="text-babel-dust/60 text-xs italic">
          Explore pages to collect rare words, palindromes, and more. Each rarity type you find earns a badge.
        </p>
      </div>
    );
  }

  const collectMap = new Map(collections.map((c) => [c.kind, c.count]));

  return (
    <div className="mb-12">
      <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
        <Gem size={16} /> Rarity Collections
      </h2>

      {/* Rarity kind badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {RARITY_BADGE_DEFS.map((b) => {
          const count = collectMap.get(b.kind) || 0;
          const unlocked = count > 0;
          return (
            <div
              key={b.kind}
              className={`flex flex-col items-center gap-2 p-4 rounded border transition-colors text-center ${
                unlocked
                  ? 'border-babel-gold/50 bg-babel-gold/5'
                  : 'border-babel-lines/20 bg-black/20 opacity-50'
              }`}
            >
              <span className={unlocked ? 'text-babel-gold' : 'text-babel-dust/60'}>
                {b.icon}
              </span>
              <div>
                <p className={`text-xs ${unlocked ? 'text-babel-gold' : 'text-babel-dust'}`}>
                  {b.label}
                </p>
                <p className="text-[10px] text-babel-dust/60 mt-0.5">
                  {unlocked ? `${count} found` : 'Locked'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alphabet badge hunt: which starting letters have been found */}
      <h3 className="text-babel-gold/70 text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
        <Star size={12} /> Alphabet Badge Hunt
      </h3>
      <p className="text-babel-dust/60 text-[10px] mb-3 italic">
        Find a rare word or palindrome starting with each letter to complete the alphabet.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {ALPHABET_GRID.map((letter) => {
          const found = wordBadges.includes(letter);
          return (
            <div
              key={letter}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono uppercase border transition-colors ${
                found
                  ? 'border-babel-gold/60 bg-babel-gold/10 text-babel-gold'
                  : 'border-babel-lines/20 bg-black/20 text-babel-dust/40'
              }`}
              title={found ? `Found: ${letter}` : `Not yet found: ${letter}`}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper with Suspense boundary required by useSearchParams() in Next.js App Router.
export default function JournalPageWrapper() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-babel-dark" />}>
      <JournalPage />
    </Suspense>
  );
}

function JournalPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');
  const showSaved = tab === 'saved';
  const showOwned = tab === 'owned';

  const [stats, setStats] = useState<TravelerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(() => getLocalName() || '');

  const [signedIn, setSignedIn] = useState(false);

  // Saved pages
  const [savedPages, setSavedPages] = useState<DiscoveryItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Owned chambers
  const [ownedChambers, setOwnedChambers] = useState<ClaimItem[]>([]);
  const [ownedLoading, setOwnedLoading] = useState(false);

  const load = async () => {
    const res = await travelerApi.stats();
    if (res?.stats) setStats(res.stats as TravelerStats);
    setLoading(false);
  };

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await travelerApi.recent();
      if (res?.discoveries) setSavedPages(res.discoveries as DiscoveryItem[]);
    } catch {
      /* ignore */
    }
    setSavedLoading(false);
  }, []);

  const loadOwned = useCallback(async () => {
    setOwnedLoading(true);
    try {
      const res = await travelerApi.myClaims();
      if (res?.claims) setOwnedChambers(res.claims as ClaimItem[]);
    } catch {
      /* ignore */
    }
    setOwnedLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await initSession();
      setSignedIn(isSignedIn());
      setNameInput(getLocalName() || '');
      await load();
    })();
  }, []);

  useEffect(() => {
    if (showSaved) loadSaved();
    if (showOwned) loadOwned();
  }, [showSaved, showOwned, loadSaved, loadOwned]);

  const saveName = async () => {
    const clean = nameInput.trim().slice(0, 40);
    setLocalName(clean);
    await travelerApi.setName(clean);
    setEditingName(false);
    load();
  };

  const unlocked = new Set(stats?.achievements || []);

  // ── Saved Pages tab ─────────────────────────────────────────────────────────
  if (showSaved) {
    return (
      <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment font-mono">
        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <Link href="/journal" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8">
            <ArrowLeft size={16} /> Back to Journal
          </Link>

          <h2 className="text-2xl text-babel-gold tracking-widest uppercase mb-2 flex items-center gap-3">
            <Bookmark size={20} /> Saved Pages
          </h2>
          <p className="text-babel-dust/60 text-xs mb-8 italic">
            Pages you've chosen to remember. Click to revisit them.
          </p>

          {savedLoading ? (
            <p className="text-babel-dust animate-pulse">Retrieving your saved pages…</p>
          ) : savedPages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-babel-dust text-sm">No saved pages yet.</p>
              <p className="text-babel-dust/60 text-xs mt-2">
                When reading a book, tap "Save this page" to keep it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedPages.map((d, i) => (
                <Link
                  key={d._id || i}
                  href={`/room/${d.coord.roomId}/${d.coord.wall}/${d.coord.shelf}/${d.coord.book}/${d.coord.page}`}
                  className="flex items-center justify-between gap-4 p-4 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-babel-parchment text-sm truncate group-hover:text-babel-gold transition-colors">
                      {d.label || `${d.coord.roomId} · p.${d.coord.page}`}
                    </p>
                    <p className="text-babel-dust/60 text-[10px] tracking-wider uppercase mt-1">
                      {d.coord.roomId} — {d.coord.wall}/{d.coord.shelf}/{d.coord.book}/{d.coord.page}
                    </p>
                    {(d.rarities && d.rarities.length > 0) && (
                      <p className="text-babel-gold/70 text-[10px] mt-1">
                        {d.rarities.length} rare find{d.rarities.length > 1 ? 's' : ''} on this page
                      </p>
                    )}
                  </div>
                  <ExternalLink size={14} className="text-babel-dust/40 group-hover:text-babel-gold shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Chambers Owned tab ──────────────────────────────────────────────────────
  if (showOwned) {
    return (
      <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment font-mono">
        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <Link href="/journal" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8">
            <ArrowLeft size={16} /> Back to Journal
          </Link>

          <h2 className="text-2xl text-babel-gold tracking-widest uppercase mb-2 flex items-center gap-3">
            <Home size={20} /> Chambers Owned
          </h2>
          <p className="text-babel-dust/60 text-xs mb-8 italic">
            Chambers you've claimed as your own. Each one is yours forever.
          </p>

          {ownedLoading ? (
            <p className="text-babel-dust animate-pulse">Consulting the registry…</p>
          ) : ownedChambers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-babel-dust text-sm">No chambers owned yet.</p>
              <p className="text-babel-dust/60 text-xs mt-2">
                Visit a chamber and claim it to make it yours.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ownedChambers.map((c, i) => (
                <Link
                  key={c.roomId || i}
                  href={`/room/${c.roomId}/1/1/1/1`}
                  className="flex items-center justify-between gap-4 p-4 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-babel-parchment text-sm truncate group-hover:text-babel-gold transition-colors">
                      Chamber {c.roomId}
                    </p>
                    {c.dedication && (
                      <p className="text-babel-dust/60 text-[10px] italic mt-1">
                        &ldquo;{c.dedication}&rdquo;
                      </p>
                    )}
                    <p className="text-babel-dust/60 text-[10px] tracking-wider uppercase mt-1">
                      Claimed {new Date(c.claimedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-babel-dust/40 group-hover:text-babel-gold shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Journal tab ────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment font-mono">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        {/* Identity */}
        <div className="mb-10">
          <p className="text-babel-dust text-xs tracking-widest uppercase mb-2">Seeker's Journal</p>
          {signedIn ? (
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

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              <Link
                href="/journal?tab=saved"
                className="flex items-center gap-3 p-4 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group"
              >
                <Bookmark size={20} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-babel-parchment text-sm group-hover:text-babel-gold transition-colors">Saved Pages</p>
                  <p className="text-babel-dust/60 text-[10px]">Pages you've bookmarked</p>
                </div>
              </Link>
              <Link
                href="/journal?tab=owned"
                className="flex items-center gap-3 p-4 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group"
              >
                <Home size={20} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-babel-parchment text-sm group-hover:text-babel-gold transition-colors">Chambers Owned</p>
                  <p className="text-babel-dust/60 text-[10px]">Your claimed chambers</p>
                </div>
              </Link>
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

            {/* Rarity Collection Badges */}
            <RarityBadges />

            {/* Achievements */}
            <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 mt-10">Achievements</h2>
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