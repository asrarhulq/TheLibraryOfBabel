'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchForText } from '@/lib/babel/search';
import { ALPHABET } from '@/lib/babel/generator';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const loc = searchForText(query);
      const roomId = `${loc.x}-${loc.y}-${loc.z}`;
      router.push(`/room/${roomId}/${loc.wall}/${loc.shelf}/${loc.book}/${loc.page}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during search.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-babel-dark text-babel-parchment font-mono p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap content-start overflow-hidden">
        {Array.from({ length: 1000 }).map((_, i) => (
          <span key={i} className="m-1">{ALPHABET[Math.floor(Math.random() * ALPHABET.length)]}</span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-babel-wall/80 backdrop-blur-md p-8 md:p-12 border border-babel-lines/30 rounded-sm shadow-2xl">
        <h1 className="text-3xl tracking-widest text-babel-gold mb-6 text-center uppercase">Seek and Find</h1>
        <p className="text-babel-dust text-sm md:text-base text-center mb-8 leading-relaxed">
          The Library contains every possible combination of 29 characters. 
          Enter a phrase to instantly calculate its exact location within the infinite hexagons.
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
            disabled={!query.trim()}
            className="w-full bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            Calculate Coordinate
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
