'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import seedrandom from 'seedrandom';
import { ALPHABET } from '@/lib/babel/alphabet';
import { travelerApi, getLocalName } from '@/lib/traveler/client';
import SearchDescent from '@/components/SearchDescent';

interface Coord {
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [descent, setDescent] = useState<Coord | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      // The coordinate math runs server-side so the encoding algorithm never ships to the browser.
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'An error occurred during search.');
        setBusy(false);
        return;
      }
      const { roomId, wall, shelf, book, page } = data;
      const coord = { roomId, wall, shelf, book, page };
      // Record the phrase discovery (fire-and-forget).
      travelerApi.phrase(coord, getLocalName() || 'Anonymous Traveler', query.trim());
      // Prefetch the room so it's ready the instant the descent finishes.
      router.prefetch(`/room/${roomId}/${wall}/${shelf}/${book}/${page}`);
      // Play the cinematic descent, then navigate.
      setDescent(coord);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during search.');
      setBusy(false);
    }
  };

  const arrive = () => {
    if (!descent) return;
    router.push(
      `/room/${descent.roomId}/${descent.wall}/${descent.shelf}/${descent.book}/${descent.page}`
    );
  };

  // Stable, deterministic character rain for the backdrop (computed once).
  const backdrop = useMemo(() => {
    const rng = seedrandom('babel-search-backdrop');
    return Array.from({ length: 900 }, () => ALPHABET[Math.floor(rng() * ALPHABET.length)]);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-babel-dark text-babel-parchment font-mono p-4 relative overflow-hidden">
      {descent && <SearchDescent query={query.trim()} coord={descent} onArrive={arrive} />}

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex flex-wrap content-start overflow-hidden select-none leading-4 text-xs">
        {backdrop.map((ch, i) => (
          <span key={i} className="m-1">{ch}</span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-babel-wall/80 backdrop-blur-md p-8 md:p-12 border border-babel-lines/30 rounded-sm shadow-2xl babel-rise-in">
        <h1 className="text-3xl tracking-[0.3em] text-babel-gold mb-6 text-center uppercase babel-breathe">Seek and Find</h1>
        <p className="text-babel-parchment/80 text-base md:text-lg text-center mb-8 leading-relaxed font-serif italic">
          Every arrangement of 29 characters already exists somewhere in the stacks.
          <span className="block not-italic font-sans text-sm text-babel-dust mt-2">
            Name any phrase, and its exact coordinate is computed — not searched.
          </span>
        </p>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. my name is asrar"
            className="w-full bg-black/50 border-2 border-babel-lines/50 p-4 text-babel-parchment focus:outline-none focus:border-babel-gold focus:bg-black/80 transition-colors font-mono placeholder:text-babel-dust/70 shadow-inner"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={!query.trim() || busy}
            className="w-full bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {busy ? 'Locating…' : 'Calculate Coordinate'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs text-babel-dust/70">
            Valid characters: a-z, space, comma, period.<br/>
            Long queries may take you very deep into the library.
          </p>
        </div>
      </div>
    </div>
  );
}
