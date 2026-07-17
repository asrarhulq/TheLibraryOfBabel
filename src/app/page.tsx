'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
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
  return (
    <div className="w-full h-full relative">
      <Suspense fallback={null}>
        <LibraryCanvas />
      </Suspense>
      
      <RecentDiscoveries />
      
      {/* Title — pinned to the top, clear of the hexagon field below */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none text-center babel-rise-in z-10">
        <h1 className="text-xl md:text-3xl text-babel-parchment font-mono tracking-[0.35em] uppercase babel-breathe">
          The Infinite Library
        </h1>
      </div>

      {/* Instruction — kept low and unobtrusive */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none text-center babel-fade-in z-10">
        <p className="not-italic font-sans text-xs tracking-widest uppercase text-babel-gold-dim">
          Drag to drift · click a chamber to enter
        </p>
      </div>
    </div>
  );
}
