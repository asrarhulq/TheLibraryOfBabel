'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Hexagon,
  BookOpen,
  Search,
  Sparkles,
  Trophy,
  Calendar,
  PenLine,
  Volume2,
} from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

// One consistent row: gold icon in a bordered tile, heading, then explanatory body.
function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="flex gap-4">
      <div className="shrink-0">
        <div className="w-10 h-10 grid place-items-center rounded border border-babel-lines/40 bg-babel-gold/5 text-babel-gold">
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-babel-parchment font-mono font-bold tracking-widest uppercase text-sm mb-2">
          {title}
        </h3>
        <div className="text-babel-dust leading-relaxed text-sm md:text-[15px] space-y-2">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need the DOM; only enable after mount (avoids SSR mismatch).
  useEffect(() => setMounted(true), []);

  // Prevent background scrolling when the modal is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <>
      {/* Navbar trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs uppercase tracking-wider hover:text-babel-gold transition-colors duration-300 border border-babel-lines/50 hover:border-babel-gold px-3 py-1 rounded"
      >
        Manual
      </button>

      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm overflow-y-auto babel-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="min-h-full flex items-center justify-center p-4 md:p-6">
            <div className="relative w-full max-w-2xl my-8 flex flex-col bg-babel-wall/95 border border-babel-lines/40 rounded-sm shadow-[0_0_60px_rgba(212,175,55,0.12)] babel-rise-in gpu-accelerated">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-babel-lines/20 bg-black/30 shrink-0">
                <div>
                  <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-1">
                    The Manual
                  </p>
                  <h2 className="text-xl md:text-2xl font-mono tracking-widest text-babel-gold uppercase">
                    The Architecture of Infinity
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close manual"
                  className="text-babel-dust hover:text-babel-gold transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                {/* Borges epigraph — the literary voice */}
                <blockquote className="mb-8 pl-4 border-l-2 border-babel-gold/40">
                  <p className="text-babel-parchment/90 leading-relaxed font-serif text-lg italic">
                    &ldquo;The universe (which others call the Library) is composed of an
                    indefinite and perhaps infinite number of hexagonal galleries&hellip;&rdquo;
                  </p>
                  <cite className="text-sm text-babel-dust not-italic mt-2 block">
                    &mdash; Jorge Luis Borges, <span className="italic">The Library of Babel</span>
                  </cite>
                </blockquote>

                <div className="space-y-8">
                  <Section icon={<Hexagon size={20} />} title="The Idea">
                    <p>
                      Every page here holds exactly{' '}
                      <span className="text-babel-parchment">3,200 characters</span> drawn from a
                      29-symbol alphabet &mdash; the letters <span className="text-babel-parchment">a&ndash;z</span>,
                      plus <span className="text-babel-parchment">space</span>,{' '}
                      <span className="text-babel-parchment">comma</span>, and{' '}
                      <span className="text-babel-parchment">period</span>. Because the Library holds
                      every possible arrangement of those symbols, it already contains every
                      sentence, every poem, every book that could ever be written &mdash; alongside
                      an ocean of gibberish. Nothing is stored: each page is{' '}
                      <span className="text-babel-gold">computed on demand</span> from its
                      coordinate, so the same address always yields the same page, for everyone,
                      forever.
                    </p>
                  </Section>

                  <Section icon={<BookOpen size={20} />} title="Reading a Page">
                    <p>Two kinds of text will glow out of the noise as you read:</p>
                    <ul className="space-y-2">
                      <li className="flex gap-2">
                        <span className="text-babel-gold font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] shrink-0">
                          gold
                        </span>
                        <span>
                          &mdash; a real English word (4 letters or more) that surfaced by pure
                          chance in the chaos.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-white bg-babel-gold/20 px-1 underline underline-offset-2 shrink-0">
                          white
                        </span>
                        <span>
                          &mdash; the exact phrase you searched for, marking the spot it was
                          promised to appear.
                        </span>
                      </li>
                    </ul>
                    <p>
                      Move between the four walls, thirty-two shelves, thirty-two books and 410
                      pages of a chamber using the panel on the left. Any page can be saved as an
                      image with <span className="text-babel-parchment">Export PNG</span>.
                    </p>
                  </Section>

                  <Section icon={<Search size={20} />} title="Searching Is Not Searching">
                    <p>
                      Combing an infinite Library by hand would take infinite time. So we don&rsquo;t
                      look &mdash; we <span className="text-babel-gold">calculate</span>. Type any
                      phrase and it is converted into an enormous number, and that number is turned
                      directly into a physical <span className="text-babel-parchment">X&ndash;Y&ndash;Z</span>{' '}
                      address plus a wall, shelf, book and page. The words you seek literally
                      dictate the location of the room that holds them. This runs on our server, so
                      the phrase always lands exactly where the mathematics says it must.
                    </p>
                  </Section>

                  <Section icon={<Sparkles size={20} />} title="Rare Finds">
                    <p>
                      Some accidents are rarer than others. When something genuinely improbable
                      surfaces &mdash; a word of{' '}
                      <span className="text-babel-parchment">5 letters or more</span>, a{' '}
                      <span className="text-babel-parchment">palindrome</span>, several real words{' '}
                      <span className="text-babel-parchment">in a row</span>, or even{' '}
                      <span className="text-babel-parchment">your own name</span> &mdash; the page
                      marks it with a{' '}
                      <span className="text-babel-gold babel-rarity">✦</span> and it is recorded as a
                      discovery. They appear on perhaps one page in eighty, so each one is a small
                      event.
                    </p>
                  </Section>

                  <Section icon={<Trophy size={20} />} title="Your Journal">
                    <p>
                      The <span className="text-babel-parchment">Journal</span> tracks your
                      expedition: chambers visited, pages read, words uncovered, rare finds, and
                      Seeker points. Milestones unlock{' '}
                      <span className="text-babel-parchment">achievements</span>, and returning on
                      consecutive days builds a <span className="text-babel-gold">streak</span>.
                      Name yourself there to start hunting for your own name in the void.
                    </p>
                  </Section>

                  <Section icon={<Calendar size={20} />} title="The Daily Chamber">
                    <p>
                      Each day, one chamber is chosen for the whole world &mdash; the same room for
                      every traveler until midnight. Visit the{' '}
                      <span className="text-babel-parchment">Daily</span> chamber to keep your
                      streak alive and see what today&rsquo;s page happens to hide.
                    </p>
                  </Section>

                  <Section icon={<PenLine size={20} />} title="The Traveler's Log">
                    <p>
                      No one owns these pages, but anyone can leave a mark. Notes you write in the{' '}
                      <span className="text-babel-parchment">Traveler&rsquo;s Log</span> are shared
                      with every future visitor to that exact page, and the newest appear under{' '}
                      <span className="text-babel-parchment">Recent Discoveries</span> on the home
                      screen.
                    </p>
                  </Section>

                  <Section icon={<Volume2 size={20} />} title="Sound">
                    <p>
                      Each chamber has its own drifting drone, generated from the room&rsquo;s
                      address, with distant tones surfacing now and then. Toggle it with the{' '}
                      <span className="text-babel-parchment">speaker icon</span> &mdash; headphones
                      are recommended.
                    </p>
                  </Section>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-babel-lines/20 bg-black/30 flex flex-col items-center gap-4 shrink-0">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-2 bg-babel-gold/10 hover:bg-babel-gold/20 border border-babel-gold text-babel-gold font-mono tracking-widest uppercase transition-colors duration-300"
                >
                  Begin Exploration
                </button>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-babel-dust/70">
                  <a href="/terms" onClick={() => setIsOpen(false)} className="hover:text-babel-gold transition-colors">Terms</a>
                  <a href="/privacy" onClick={() => setIsOpen(false)} className="hover:text-babel-gold transition-colors">Privacy</a>
                  <a href="/refunds" onClick={() => setIsOpen(false)} className="hover:text-babel-gold transition-colors">Refunds</a>
                  <a href="mailto:contact@thelibrary.page" className="hover:text-babel-gold transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
