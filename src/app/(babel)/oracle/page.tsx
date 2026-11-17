'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MapPin, BookOpen, ExternalLink } from 'lucide-react';

interface OraclePath {
  label: string;
  phrase: string;
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

interface OracleResponse {
  answer: string;
  primaryPath: OraclePath;
  paths: OraclePath[];
}

export default function OraclePage() {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [oracle, setOracle] = useState<OracleResponse | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    setOracle(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);
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
      setOracle(data as OracleResponse);
      setBusy(false);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The void took too long to answer. Try a shorter question.');
      } else {
        setError(err instanceof Error ? err.message : 'The Library could not hear you.');
      }
      setBusy(false);
    }
  };

  const askAgain = () => {
    setOracle(null);
    setQuestion('');
    setError('');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment">
      <div className="max-w-2xl mx-auto p-6 md:p-10 babel-rise-in">
        <Link
          href="/"
          className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm font-mono mb-8"
        >
          <ArrowLeft size={16} /> Return to the Void
        </Link>

        {!oracle ? (
          <>
            {/* Question form */}
            <div className="bg-babel-wall/80 backdrop-blur-md p-8 md:p-12 border border-babel-gold/30 rounded-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={28} className="text-babel-gold" />
                <h1 className="text-3xl tracking-[0.3em] text-babel-gold uppercase babel-breathe">
                  The Oracle
                </h1>
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
                {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

                <button
                  type="submit"
                  disabled={!question.trim() || busy}
                  className="w-full bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4 font-mono"
                >
                  {busy ? 'Consulting the infinite…' : 'Ask the Oracle'}
                </button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-xs text-babel-dust/70 italic font-serif">
                  &ldquo;The Library is a sphere whose exact center is any one of its hexagons
                  and whose circumference is inaccessible.&rdquo;
                </p>
                <p className="text-[10px] text-babel-dust/50 mt-3 uppercase tracking-widest">
                  — Jorge Luis Borges
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Oracle response */
          <div className="babel-fade-in">
            {/* The Answer */}
            <div className="bg-black/30 border border-babel-gold/30 rounded-sm p-6 md:p-10 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-babel-gold" />
                <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase font-mono">
                  The Oracle speaks
                </p>
              </div>

              <p className="text-babel-parchment/90 font-serif italic text-lg md:text-xl leading-relaxed mb-4">
                &ldquo;{oracle.answer}&rdquo;
              </p>

              <p className="text-babel-dust/60 text-xs mt-4">
                You asked: <span className="text-babel-gold/80 italic">&ldquo;{question.trim()}&rdquo;</span>
              </p>
            </div>

            {/* Paths — multiple curated destinations */}
            <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2 font-mono">
              <BookOpen size={16} /> Paths revealed for you
            </h2>
            <p className="text-babel-dust/60 text-xs mb-6 font-serif italic">
              Each path leads to a different page in the infinite Library — a page that has
              always held a fragment of your answer. Choose where to go.
            </p>

            <div className="space-y-3 mb-8">
              {oracle.paths.map((p, i) => (
                <Link
                  key={`${p.roomId}-${p.wall}-${p.shelf}-${p.book}-${p.page}`}
                  href={`/room/${p.roomId}/${p.wall}/${p.shelf}/${p.book}/${p.page}`}
                  className={`flex items-center justify-between gap-4 p-4 rounded border transition-all group ${
                    i === 0
                      ? 'border-babel-gold/50 bg-babel-gold/5 hover:bg-babel-gold/10'
                      : 'border-babel-lines/20 bg-black/20 hover:border-babel-gold/40 hover:bg-babel-gold/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 ${i === 0 ? 'text-babel-gold' : 'text-babel-gold/50'}`}>
                      {i === 0 ? (
                        <Sparkles size={18} />
                      ) : (
                        <MapPin size={16} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-mono uppercase tracking-wider truncate group-hover:text-babel-gold transition-colors ${
                        i === 0 ? 'text-babel-gold' : 'text-babel-parchment'
                      }`}>
                        {p.label}
                      </p>
                      <p className="text-babel-dust/50 text-[10px] font-mono mt-0.5 truncate">
                        &ldquo;{p.phrase}&rdquo; · {p.roomId}
                      </p>
                    </div>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-babel-dust/40 group-hover:text-babel-gold shrink-0 transition-colors"
                  />
                </Link>
              ))}
            </div>

            {/* Ask again */}
            <div className="text-center pb-8">
              <button
                onClick={askAgain}
                className="text-babel-dust/60 hover:text-babel-gold text-xs uppercase tracking-widest font-mono transition-colors border border-babel-lines/30 hover:border-babel-gold/50 px-4 py-2 rounded"
              >
                Ask another question
              </button>
            </div>

            <div className="text-center pb-8">
              <p className="text-babel-dust/30 text-[10px] italic font-serif">
                &ldquo;I cannot sleep unless I am surrounded by books.&rdquo;
              </p>
              <p className="text-babel-dust/20 text-[9px] mt-1 uppercase tracking-widest">
                — Jorge Luis Borges
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}