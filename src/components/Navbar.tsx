'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import AudioToggle from '@/components/AudioToggle';
import InfoModal from '@/components/InfoModal';
import IntroLogo from '@/components/IntroLogo';
import SignInButton from '@/components/SignInButton';
import { BookMarked, Sparkles, Heart, ScrollText, Trophy, Search, Menu, X } from 'lucide-react';

// Links that live inside the menu (kept off the bar so it never crowds).
// Search is not here — it sits centered on the bar.
const MENU_LINKS = [
  { href: '/wall', label: 'Wall', icon: ScrollText },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/daily', label: 'Daily', icon: Sparkles },
  { href: '/journal', label: 'Journal', icon: BookMarked },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const close = () => setMenuOpen(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-3 sm:px-4 py-3 bg-babel-dark/80 backdrop-blur-sm border-b border-babel-lines/30 text-babel-parchment flex justify-between items-center gap-3">
      {/* Brand */}
      <div className="flex items-baseline gap-2.5 min-w-0">
        <div className="self-center">
          <IntroLogo />
        </div>
        <Link
          href="/"
          className="text-sm font-mono tracking-widest uppercase truncate hover:text-babel-gold transition-colors duration-300 shrink-0"
        >
          <span className="hidden sm:inline">The Infinite Library of Babel</span>
          <span className="sm:hidden">Babel</span>
        </Link>
        <span className="text-babel-dust text-xs font-mono hidden lg:inline shrink-0">by</span>
        <a
          href="https://asrarul.com"
          target="_blank"
          rel="noopener noreferrer"
          className="relative hidden lg:inline-block text-xs font-mono tracking-widest uppercase shrink-0 hover:text-babel-gold transition-colors duration-300 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-babel-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
        >
          Asrar ul Haq
        </a>
      </div>

      {/* Search — centered on the bar */}
      <Link
        href="/search"
        title="Search the Library"
        className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 px-4 py-1.5 rounded border border-babel-lines/50 hover:border-babel-gold hover:text-babel-gold transition-colors duration-300 text-xs tracking-widest uppercase"
      >
        <Search size={14} /> Search
      </Link>

      {/* Right side — a small, fixed set of controls at every width */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Manual on the bar (hidden on the smallest screens; also in the menu) */}
        <div className="hidden sm:block">
          <InfoModal />
        </div>

        {/* Sound on the bar only on sm+ (on phones it lives in the menu) */}
        <div className="hidden sm:block">
          <AudioToggle />
        </div>

        {/* Search icon — on the phone bar (on sm+ Search sits centered on the bar) */}
        <Link
          href="/search"
          title="Search the Library"
          aria-label="Search"
          className="sm:hidden flex items-center text-babel-parchment hover:text-babel-gold p-1.5 border border-babel-lines/50 rounded transition-colors"
        >
          <Search size={18} />
        </Link>

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

      {/* Phone: full-screen menu, portalled to body so the nav can't clip it */}
      {menuOpen && mounted && createPortal(
        <div className="sm:hidden fixed inset-0 z-[120] bg-babel-void/98 backdrop-blur-md flex flex-col babel-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-babel-lines/30">
              <span className="font-mono text-sm tracking-widest uppercase text-babel-gold">Menu</span>
              <button
                onClick={close}
                aria-label="Close menu"
                className="text-babel-parchment hover:text-babel-gold p-1.5 border border-babel-lines/50 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="px-6 py-5 border-b border-babel-lines/15">
                <InfoModal />
              </div>
              <Link href="/search" onClick={close} className="flex items-center gap-4 px-6 py-5 border-b border-babel-lines/15 text-lg tracking-widest uppercase text-babel-parchment hover:text-babel-gold">
                <Search size={20} /> Search
              </Link>
              {MENU_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={close} className="flex items-center gap-4 px-6 py-5 border-b border-babel-lines/15 text-lg tracking-widest uppercase text-babel-parchment hover:text-babel-gold">
                  <Icon size={20} /> {label}
                </Link>
              ))}
              {/* Sound toggle lives in the menu on phones */}
              <div className="px-6 py-5 border-b border-babel-lines/15 flex items-center gap-4 text-lg tracking-widest uppercase text-babel-parchment">
                <AudioToggle /> <span className="text-babel-dust text-sm normal-case tracking-wider">Ambient sound</span>
              </div>
              <div className="px-6 py-5" onClick={close}>
                <SignInButton variant="drawer" />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Desktop: compact dropdown (not portalled — positioned under the toggle) */}
      {menuOpen && (
        <div className="hidden sm:block">
          <div className="fixed inset-0 top-[57px] z-40" onClick={close} />
          <div className="absolute top-full right-4 mt-2 w-56 z-50 bg-babel-wall/98 backdrop-blur-md border border-babel-lines/30 rounded-md shadow-2xl overflow-hidden flex flex-col">
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
          </div>
        </div>
      )}
    </nav>
  );
}
