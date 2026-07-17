import Link from 'next/link';
import AudioToggle from '@/components/AudioToggle';
import InfoModal from '@/components/InfoModal';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-4 bg-babel-dark/80 backdrop-blur-sm border-b border-babel-lines/30 text-babel-parchment flex justify-between items-center">
      <div className="text-sm font-mono tracking-widest uppercase">
        <Link href="/" className="hover:text-babel-gold transition-colors duration-300">
          The Infinite Library of Babel
        </Link>
        <span className="text-babel-dust mx-2">by</span>
        <a 
          href="https://asrarul.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative inline-block hover:text-babel-gold transition-colors duration-300 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-babel-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
        >
          Asrar ul Haq
        </a>
      </div>
      <div className="flex gap-4 items-center text-xs tracking-wider">
        <InfoModal />
        <AudioToggle />
        <Link href="/search" className="hover:text-babel-gold transition-colors duration-300 border border-babel-lines/50 px-3 py-1 rounded">
          SEARCH
        </Link>
      </div>
    </nav>
  );
}
