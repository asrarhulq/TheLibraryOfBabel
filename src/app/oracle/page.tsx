'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import seedrandom from 'seedrandom';
import Link from 'next/link';
import { ALPHABET } from '@/lib/babel/alphabet';
import SearchDescent from '@/components/SearchDescent';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface Coord {
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

export default function OraclePage() {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [descent, setDescent] = useState<Coord | null>(null);
  const router = useRouter();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'The Library remains silent.');
        setBusy(false);
        return;
      }
      const { roomId, wall, shelf, book, page } = data;
      const coord = { roomId, wall, shelf, book, page };
      router.prefetch(`/room/${roomId}/${wall}/${shelf}/${book}/${page}`);
      setDescent(coord);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The void took too long to answer. Try a shorter question.');
      } else {
        setError(err instanceof Error ? err.message : 'The Library could not hear you.');
      }
      setBusy(false);
    }
  };

  const arrive = () => {
    if (!descent) return;
    router.push(
      `/room/${descent.roomId}/${descent.wall}/${descent.shelf}/${descent.book}/${descent.page}`
    );
  };

  const backdrop = useMemo(() => {
    const rng = seedrandom('babel-oracle-backdrop');
    return Array.from({ length: 900 }, () => ALPHABET[Math.floor(rng() * ALPHABET.length)]);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-babel-dark text-babel-parchment font-mono p-4 relative overflow-hidden">
      {descent && <SearchDescent query={question.trim()} coord={descent} onArrive={arrive} />}

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex flex-wrap content-start overflow-hidden select-none leading-4 text-xs">
        {backdrop.map((ch, i) => (
          <span key={i} className="m-1">{ch}</span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-babel-wall/80 backdrop-blur-md p-8 md:p-12 border border-babel-gold/30 rounded-sm shadow-2xl babel-rise-in">
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={28} className="text-babel-gold" />
          <h1 className="text-3xl tracking-[0.3em] text-babel-gold uppercase babel-breathe">The Oracle</h1>
        </div>

        <p className="text-babel-parchment/80 text-base md:text-lg text-center mb-4 leading-relaxed font-serif italic">
          The answer to your question already exists somewhere in the infinite stacks.
          <span className="block not-italic font-sans text-sm text-babel-dust mt-2">
            Ask, and the Library will show you where it was always waiting.
          </span>
        </p>

        <form onSubmit={handleAsk} className="flex flex-col gap-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What does your heart seek to know…?"
            className="w-full bg-black/50 border-2 border-babel-lines/50 p-4 text-babel-parchment focus:outline-none focus:border-babel-gold focus:bg-black/80 transition-colors font-mono placeholder:text-babel-dust/70 shadow-inner resize-none h-28"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!question.trim() || busy}
            className="w-full bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {busy ? 'Consulting the infinite…' : 'Ask the Library'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs text-babel-dust/70 italic font-serif">
            &ldquo;The Library is a sphere whose exact center is any one of its hexagons and whose
            circumference is inaccessible.&rdquo;
          </p>
          <p className="text-[10px] text-babel-dust/50 mt-3 uppercase tracking-widest">
            — Jorge Luis Borges
          </p>
        </div>
      </div>
    </div>
  );
}