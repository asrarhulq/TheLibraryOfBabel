'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import RecentDiscoveries from '@/components/RecentDiscoveries';

// Use dynamic import for Three.js component to prevent SSR issues
const LibraryCanvas = dynamic(() => import('@/components/LibraryCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-babel-dark text-babel-parchment font-mono animate-pulse">
      INITIALIZING THE INFINITE...
    </div>
  ),
});

export default function Home() {
  // The title + tagline greet the visitor at the top, then drift away so the
  // library is unobstructed. Unmount after the fade-cycle finishes.
  const [showTitle, setShowTitle] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowTitle(false), 6600); // matches babel-title-cycle
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full h-full relative">
      <Suspense fallback={null}>
        <LibraryCanvas />
      </Suspense>

      <RecentDiscoveries />

      {/* Title + tagline, together at the top — a brief cinematic greeting that fades away. */}
      {showTitle && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none text-center z-10 px-4 babel-title-cycle">
          <h1 className="text-xl md:text-3xl text-babel-parchment font-mono tracking-[0.35em] uppercase">
            The Infinite Library
          </h1>
          <p className="font-serif italic text-babel-parchment/80 text-base md:text-xl leading-relaxed mt-3">
            Every book that could be written already waits here.
          </p>
        </div>
      )}

      {/* Persistent instruction, kept low and unobtrusive. */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none text-center babel-fade-in z-10">
        <p className="font-sans text-[11px] md:text-xs tracking-[0.25em] uppercase text-babel-gold-dim">
          Drag to drift · click a chamber to enter
        </p>
      </div>
    </div>
  );
}