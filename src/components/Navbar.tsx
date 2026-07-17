'use client';

import { useState } from 'react';
import Link from 'next/link';
import AudioToggle from '@/components/AudioToggle';
import InfoModal from '@/components/InfoModal';
import IntroLogo from '@/components/IntroLogo';
import SignInButton from '@/components/SignInButton';
import { BookMarked, Sparkles, Heart, ScrollText, Trophy, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/immortalize', label: 'Immortalize', icon: Heart, accent: true },
  { href: '/wall', label: 'Wall', icon: ScrollText },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/daily', label: 'Daily', icon: Sparkles },
  { href: '/journal', label: 'Journal', icon: BookMarked },
  { href: '/search', label: 'Search', icon: null },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 py-3 bg-babel-dark/80 backdrop-blur-sm border-b border-babel-lines/30 text-babel-parchment flex justify-between items-center gap-3">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <IntroLogo />
        <div className="text-sm font-mono tracking-widest uppercase truncate">
          <Link href="/" className="hover:text-babel-gold transition-colors duration-300">
            <span className="hidden sm:inline">The Infinite Library of Babel</span>
            <span className="sm:hidden">Babel</span>
          </Link>
          <span className="text-babel-dust mx-2 text-xs hidden lg:inline">by</span>
          <a
            href="https://asrarul.com"
            target="_blank"
            rel="noopener noreferrer"
            className="relative hidden lg:inline-block text-xs hover:text-babel-gold transition-colors duration-300 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-babel-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
          >
            Asrar ul Haq
          </a>
        </div>
      </div>

      {/* Desktop links */}
      <div className="hidden md:flex gap-3 items-center text-xs tracking-wider">
        <InfoModal />
        <AudioToggle />
        {LINKS.map(({ href, label, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1 px-3 py-1 rounded border transition-colors duration-300 ${
              accent
                ? 'text-babel-gold border-babel-gold/60 bg-babel-gold/5 hover:bg-babel-gold/15'
                : 'border-babel-lines/50 hover:text-babel-gold'
            }`}
          >
            {Icon && <Icon size={13} />} {label.toUpperCase()}
          </Link>
        ))}
        <SignInButton variant="bar" />
      </div>

      {/* Mobile: audio + hamburger */}
      <div className="flex md:hidden items-center gap-2">
        <AudioToggle />
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="text-babel-parchment hover:text-babel-gold p-1 border border-babel-lines/50 rounded"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-babel-dark/98 backdrop-blur-md border-b border-babel-lines/30 flex flex-col md:hidden">
          <div className="px-4 py-3 border-b border-babel-lines/20">
            <InfoModal />
          </div>
          {LINKS.map(({ href, label, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-4 border-b border-babel-lines/10 text-sm tracking-widest uppercase transition-colors ${
                accent ? 'text-babel-gold' : 'text-babel-parchment hover:text-babel-gold'
              }`}
            >
              {Icon && <Icon size={16} />} {label}
            </Link>
          ))}
          <SignInButton variant="drawer" />
        </div>
      )}
    </nav>
  );
}
