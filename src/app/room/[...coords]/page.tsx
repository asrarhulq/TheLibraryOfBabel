import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generatePageText, decodeRoom } from '@/lib/babel/server/generatorCore';
import BookReader from '@/components/BookReader';
import TravelerLog from '@/components/TravelerLog';
import ClaimChamber from '@/components/ClaimChamber';
import { getClaim } from '@/lib/db/claims';
import { CLAIM_PRICE, CLAIM_CURRENCY, isLiveMode } from '@/lib/payments/payments';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface RoomPageProps {
  params: Promise<{
    coords: string[];
  }>;
}

// Revalidate / cache rendered room pages at Vercel Edge CDN for 24 hours.
// This prevents serverless function invocations & DB queries on repeated hits to room coordinates.
export const revalidate = 86400;

export default async function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = await params;
  const coords = resolvedParams.coords;
  
  if (!coords || coords.length === 0) return notFound();

  const roomId = coords[0]; // e.g., "123-456-789"
  const wall = coords.length > 1 ? parseInt(coords[1], 10) : 1;
  const shelf = coords.length > 2 ? parseInt(coords[2], 10) : 1;
  const book = coords.length > 3 ? parseInt(coords[3], 10) : 1;
  const page = coords.length > 4 ? parseInt(coords[4], 10) : 1;

  if (isNaN(wall) || isNaN(shelf) || isNaN(book) || isNaN(page)) return notFound();

  // Parse X, Y, Z from roomId
  const [x, y, z] = roomId.split('-');
  if (x === undefined || y === undefined || z === undefined) return notFound();

  const text = generatePageText(x, y, z, wall, shelf, book, page);

  // Decode the search string from the coordinate (server-side)
  const searchQuery = decodeRoom(x, y, z);

  // Ownership: a chamber can be claimed by one traveler (a paid keepsake).
  const claim = await getClaim(roomId);

  const prevPage = page > 1 ? `/room/${roomId}/${wall}/${shelf}/${book}/${page - 1}` : null;
  const nextPage = page < 410 ? `/room/${roomId}/${wall}/${shelf}/${book}/${page + 1}` : null;

  return (
    <div className="w-full h-full flex flex-col-reverse md:flex-row bg-babel-dark text-babel-parchment font-mono overflow-hidden">
      {/* Sidebar Navigation — below the reader on mobile, beside it on desktop */}
      <div className="w-full md:w-64 md:h-full max-h-[45%] md:max-h-none border-t md:border-t-0 md:border-r border-babel-lines/30 p-5 md:p-6 flex flex-col gap-5 md:gap-6 shrink-0 bg-babel-wall overflow-y-auto">
        <div>
          <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8">
            <ArrowLeft size={16} /> Exit to Void
          </Link>
          <h2 className="text-xl tracking-widest text-babel-gold mb-2">Location</h2>
          <div className="text-sm text-babel-dust break-all">
            Room: {roomId}<br/>
            Wall: {wall} / 4<br/>
            Shelf: {shelf} / 32<br/>
            Book: {book} / 32<br/>
            Page: {page} / 410
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-babel-gold text-sm tracking-widest uppercase">Navigation</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link href={`/room/${roomId}/${wall === 1 ? 4 : wall - 1}/${shelf}/${book}/${page}`} className="p-2 border border-babel-lines/30 hover:border-babel-gold text-center rounded transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:bg-babel-gold/10">Prev Wall</Link>
            <Link href={`/room/${roomId}/${wall === 4 ? 1 : wall + 1}/${shelf}/${book}/${page}`} className="p-2 border border-babel-lines/30 hover:border-babel-gold text-center rounded transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:bg-babel-gold/10">Next Wall</Link>
            
            <Link href={`/room/${roomId}/${wall}/${Math.max(1, shelf - 1)}/${book}/${page}`} className="p-2 border border-babel-lines/30 hover:border-babel-gold text-center rounded transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:bg-babel-gold/10">Up Shelf</Link>
            <Link href={`/room/${roomId}/${wall}/${Math.min(32, shelf + 1)}/${book}/${page}`} className="p-2 border border-babel-lines/30 hover:border-babel-gold text-center rounded transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:bg-babel-gold/10">Down Shelf</Link>
            
            <Link href={`/room/${roomId}/${wall}/${shelf}/${Math.max(1, book - 1)}/${page}`} className="p-2 border border-babel-lines/30 hover:border-babel-gold text-center rounded transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:bg-babel-gold/10">Prev Book</Link>
            <Link href={`/room/${roomId}/${wall}/${shelf}/${Math.min(32, book + 1)}/${page}`} className="p-2 border border-babel-lines/30 hover:border-babel-gold text-center rounded transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:bg-babel-gold/10">Next Book</Link>
          </div>
        </div>

        <ClaimChamber
          roomId={roomId}
          initialClaim={claim}
          price={CLAIM_PRICE}
          currency={CLAIM_CURRENCY}
          live={isLiveMode()}
        />

        <div className="mt-auto">
          <p className="text-xs text-babel-dust italic">
            &ldquo;The library is a sphere whose exact center is any one of its hexagons and whose circumference is inaccessible.&rdquo;
          </p>
        </div>

        <TravelerLog roomId={roomId} wall={wall} shelf={shelf} book={book} page={page} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {/* Book Reader */}
        <div className="flex-1 min-h-0 relative bg-[#0a0a0c] shadow-inner overflow-hidden">
          <BookReader text={text} searchQuery={searchQuery} roomId={roomId} wall={wall} shelf={shelf} book={book} page={page} prevPage={prevPage} nextPage={nextPage} />
        </div>

        {/* Page Controls */}
        <div className="h-14 md:h-16 border-t border-babel-lines/30 flex items-center justify-between px-4 md:px-8 bg-babel-wall shrink-0 text-sm md:text-base">
          {prevPage ? (
            <Link href={prevPage} className="flex items-center gap-2 hover:text-babel-gold transition-colors">
              <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous Page</span>
            </Link>
          ) : (
            <div className="w-8 sm:w-32" /> // spacer
          )}

          <div className="text-babel-dust tabular-nums">
            {page} / 410
          </div>

          {nextPage ? (
            <Link href={nextPage} className="flex items-center gap-2 hover:text-babel-gold transition-colors">
              <span className="hidden sm:inline">Next Page</span> <ChevronRight size={20} />
            </Link>
          ) : (
            <div className="w-8 sm:w-32" /> // spacer
          )}
        </div>
      </div>
    </div>
  );
}
