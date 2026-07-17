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
      
      {/* Overlay text */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <h1 className="text-2xl md:text-4xl text-babel-parchment font-mono tracking-widest uppercase mb-2 drop-shadow-md">
          The Infinite Library
        </h1>
        <p className="text-babel-dust text-sm md:text-base font-sans max-w-lg mx-auto leading-relaxed">
          Drag to explore. Click a hexagonal chamber to enter.
        </p>
      </div>
    </div>
  );
}
