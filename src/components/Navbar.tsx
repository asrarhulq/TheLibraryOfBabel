'use client';

import { useState } from 'react';
import Link from 'next/link';
import AudioToggle from '@/components/AudioToggle';
import InfoModal from '@/components/InfoModal';
import IntroLogo from '@/components/IntroLogo';
import SignInButton from '@/components/SignInButton';
import { BookMarked, Sparkles, Heart, ScrollText, Trophy, Search, Menu, X } from 'lucide-react';

// Links that live inside the menu (kept off the bar so it never crowds).
const MENU_LINKS = [
  { href: '/wall', label: 'Wall', icon: ScrollText },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/daily', label: 'Daily', icon: Sparkles },
  { href: '/journal', label: 'Journal', icon: BookMarked },
  { href: '/search', label: 'Search', icon: Search },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-3 sm:px-4 py-3 bg-babel-dark/80 backdrop-blur-sm border-b border-babel-lines/30 text-babel-parchment flex justify-between items-center gap-3">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <IntroLogo />
        <Link
          href="/"
          className="text-sm font-mono tracking-widest uppercase truncate hover:text-babel-gold transition-colors duration-300"
        >
          <span className="hidden sm:inline">The Infinite Library of Babel</span>
          <span className="sm:hidden">Babel</span>
        </Link>
      </div>

      {/* Right side — a small, fixed set of controls at every width */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <AudioToggle />

        {/* Primary action, always visible */}
        <Link
          href="/immortalize"
          title="Immortalize a love, a moment, or a message"
          className="flex items-center gap-1 text-babel-gold border border-babel-gold/60 bg-babel-gold/5 hover:bg-babel-gold/15 transition-colors duration-300 px-2.5 sm:px-3 py-1 rounded text-xs tracking-wider"
        >
          <Heart size={13} /> <span className="hidden sm:inline">IMMORTALIZE</span>
        </Link>

        {/* Sign in, always visible from small-up */}
        <div className="hidden sm:block">
          <SignInButton variant="bar" />
        </div>

        {/* Menu toggle — holds everything else, at all widths */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="flex items-center text-babel-parchment hover:text-babel-gold p-1.5 border border-babel-lines/50 rounded transition-colors"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 top-[57px] z-40" onClick={close} />
          <div className="absolute top-full right-3 sm:right-4 mt-2 w-56 z-50 bg-babel-wall/98 backdrop-blur-md border border-babel-lines/30 rounded-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-babel-lines/20 flex items-center justify-between">
              <InfoModal />
            </div>
            {MENU_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="flex items-center gap-3 px-4 py-3 border-b border-babel-lines/10 text-sm tracking-widest uppercase text-babel-parchment hover:text-babel-gold hover:bg-babel-gold/5 transition-colors"
              >
                <Icon size={15} /> {label}
              </Link>
            ))}
            {/* Sign in also lives here for the smallest screens */}
            <div className="sm:hidden" onClick={close}>
              <SignInButton variant="drawer" />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
