'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { travelerApi } from '@/lib/traveler/client';
import { Coordinate } from '@/lib/babel/types';

interface Discovery {
  name: string;
  kind: 'phrase' | 'rarity';
  rarityKind?: string;
  text: string;
  coord: Coordinate;
  timestamp: number;
}

export default function RecentDiscoveries() {
  const [notes, setNotes] = useState<Discovery[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await travelerApi.recent();
      if (!cancelled && res?.discoveries) setNotes(res.discoveries as Discovery[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Toggle Tab — fixed to the right edge of the screen */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-babel-wall/90 border border-babel-lines/30 border-r-0 rounded-l-md px-2 py-4 text-babel-gold hover:bg-babel-wall transition-colors duration-300 shadow-lg"
        style={{ right: isOpen ? '320px' : '0px', transition: 'right 0.3s ease-in-out' }}
        title={isOpen ? 'Close discoveries' : 'Recent discoveries'}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        <span
          className="text-[10px] tracking-widest uppercase font-mono"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Discoveries
        </span>
      </button>

      {/* Sidebar Panel */}
      <div
        className="fixed top-0 right-0 z-20 h-full w-[85vw] max-w-xs bg-babel-dark/95 backdrop-blur-md border-l border-babel-lines/30 shadow-2xl flex flex-col pt-16 transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="px-5 py-4 border-b border-babel-lines/20 shrink-0">
          <h3 className="text-babel-gold text-sm tracking-widest uppercase flex items-center gap-2">
            <History size={16} /> My Discoveries
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-babel-dust/70 text-sm italic mb-2">No discoveries yet.</p>
              <p className="text-babel-dust/50 text-xs">
                Open any page and press <span className="text-babel-gold">Save page</span> to keep it
                here. Your discoveries are private to you.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map((note, i) => (
                <Link
                  key={`${note.timestamp}-${i}`}
                  href={`/room/${note.coord.roomId}/${note.coord.wall}/${note.coord.shelf}/${note.coord.book}/${note.coord.page}`}
                  className="block bg-black/40 hover:bg-black/60 p-3 rounded border border-babel-lines/10 hover:border-babel-gold/30 transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-babel-gold font-bold text-xs">{note.name}</span>
                    <span className="text-babel-dust/40 text-[10px]">
                      {note.kind === 'rarity' ? '✦ rarity' : 'phrase'}
                    </span>
                  </div>
                  <p className="text-babel-parchment/80 text-sm mb-2 italic leading-relaxed">
                    &ldquo;{note.text}&rdquo;
                  </p>
                  <span className="text-[10px] text-babel-lines group-hover:text-babel-gold transition-colors">
                    Visit Location →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
