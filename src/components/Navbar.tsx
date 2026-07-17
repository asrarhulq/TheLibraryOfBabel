import Link from 'next/link';
import AudioToggle from '@/components/AudioToggle';
import InfoModal from '@/components/InfoModal';
import { BookMarked, Sparkles, Heart } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-4 bg-babel-dark/80 backdrop-blur-sm border-b border-babel-lines/30 text-babel-parchment flex justify-between items-center">
      <div className="text-sm font-mono tracking-widest uppercase">
        <Link href="/" className="hover:text-babel-gold transition-colors duration-300">
          The Infinite Library of Babel
        </Link>
        <span className="text-babel-dust mx-2 text-xs">by</span>
        <a
          href="https://asrarul.com"
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-block text-xs hover:text-babel-gold transition-colors duration-300 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-babel-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
        >
          Asrar ul Haq
        </a>
      </div>
      <div className="flex gap-3 md:gap-4 items-center text-xs tracking-wider">
        <InfoModal />
        <AudioToggle />
        <Link
          href="/immortalize"
          title="Immortalize a love, a moment, or a message"
          className="flex items-center gap-1 text-babel-gold border border-babel-gold/60 bg-babel-gold/5 hover:bg-babel-gold/15 transition-colors duration-300 px-3 py-1 rounded"
        >
          <Heart size={13} /> <span className="hidden sm:inline">IMMORTALIZE</span>
        </Link>
        <Link
          href="/daily"
          title="Today's shared chamber"
          className="hidden md:flex items-center gap-1 hover:text-babel-gold transition-colors duration-300 border border-babel-lines/50 px-3 py-1 rounded"
        >
          <Sparkles size={13} /> DAILY
        </Link>
        <Link
          href="/journal"
          title="Your Seeker's Journal"
          className="hidden sm:flex items-center gap-1 hover:text-babel-gold transition-colors duration-300 border border-babel-lines/50 px-3 py-1 rounded"
        >
          <BookMarked size={13} /> JOURNAL
        </Link>
        <Link href="/search" className="hover:text-babel-gold transition-colors duration-300 border border-babel-lines/50 px-3 py-1 rounded">
          SEARCH
        </Link>
      </div>
    </nav>
  );
}
