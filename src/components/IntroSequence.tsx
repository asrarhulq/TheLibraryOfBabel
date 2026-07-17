'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const SEEN_KEY = 'babel_intro_seen';

// Each act: how long it holds (ms) and its content. Slow & cinematic.
interface Act {
  ms: number;
  render: () => React.ReactNode;
}

const ACTS: Act[] = [
  {
    ms: 4200,
    render: () => (
      <>
        <p className="font-serif italic text-babel-dust text-lg md:text-2xl leading-relaxed max-w-2xl">
          Imagine a library so vast
        </p>
        <p className="font-serif italic text-babel-parchment text-2xl md:text-4xl leading-relaxed max-w-2xl mt-4">
          it contains every book that could ever be written.
        </p>
      </>
    ),
  },
  {
    ms: 5200,
    render: () => (
      <>
        <p className="font-mono text-babel-gold text-sm md:text-base tracking-[0.3em] uppercase mb-6">
          Every arrangement of 29 characters
        </p>
        <p className="font-serif text-babel-parchment text-xl md:text-3xl leading-relaxed max-w-2xl">
          Every truth. Every lie. The story of your life,
          <br />
          and the story of how it ends.
        </p>
        <p className="font-sans text-babel-dust text-sm md:text-base mt-6 max-w-xl">
          All of it already exists here — waiting at a coordinate that can be calculated.
        </p>
      </>
    ),
  },
  {
    ms: 5000,
    render: () => (
      <>
        <p className="font-sans text-babel-dust/70 text-xs md:text-sm tracking-widest uppercase mb-6">
          Conceived in 1941 by
        </p>
        <p className="font-serif italic text-babel-parchment text-3xl md:text-5xl leading-tight">
          Jorge Luis Borges
        </p>
        <p className="font-serif italic text-babel-dust text-base md:text-lg mt-4">
          in his story <span className="text-babel-gold">“The Library of Babel.”</span>
        </p>
        <p className="font-sans text-babel-dust/60 text-xs md:text-sm mt-6 max-w-lg">
          This world is a tribute to his vision — every idea of the infinite Library is his.
        </p>
      </>
    ),
  },
  {
    ms: 4600,
    render: () => (
      <>
        <p className="font-mono text-babel-gold text-sm md:text-base tracking-[0.3em] uppercase mb-6">
          How to wander
        </p>
        <div className="space-y-3 text-left max-w-md mx-auto">
          <p className="font-sans text-babel-parchment text-base md:text-lg">
            <span className="text-babel-gold">Drift</span> through the hexagonal chambers.
          </p>
          <p className="font-sans text-babel-parchment text-base md:text-lg">
            <span className="text-babel-gold">Enter</span> one and read what the void holds.
          </p>
          <p className="font-sans text-babel-parchment text-base md:text-lg">
            <span className="text-babel-gold">Search</span> for any phrase — and be taken exactly
            to where it lives.
          </p>
        </div>
      </>
    ),
  },
  {
    ms: 4200,
    render: () => (
      <>
        <p className="font-serif italic text-babel-dust text-lg md:text-xl mb-4 max-w-xl">
          Watch for the glimmer of a{' '}
          <span className="text-babel-gold babel-rarity">✦ rare find</span> —
        </p>
        <p className="font-serif italic text-babel-parchment text-xl md:text-3xl leading-relaxed max-w-2xl">
          a real word, surfacing by pure chance
          <br />
          from an ocean of noise.
        </p>
      </>
    ),
  },
  {
    ms: 6000,
    render: () => (
      <>
        <p className="font-mono text-babel-gold-dim text-[10px] md:text-xs tracking-[0.4em] uppercase mb-8">
          A tribute, and an invitation
        </p>
        <p className="font-serif italic text-babel-parchment text-2xl md:text-4xl leading-relaxed max-w-2xl mb-10">
          Step into the infinite.
        </p>
        <div className="border-t border-babel-lines/40 pt-6 inline-block">
          <p className="font-sans text-babel-dust text-xs tracking-widest uppercase">Built by</p>
          <p className="font-mono text-babel-gold text-lg md:text-xl tracking-wider mt-1">
            Asrar ul Haq
          </p>
          <p className="font-sans text-babel-dust/70 text-xs md:text-sm mt-1">
            Purdue University · Engineering
          </p>
        </div>
      </>
    ),
  },
];

const TOTAL_ACTS = ACTS.length;

export default function IntroSequence() {
  const [show, setShow] = useState(false);
  const [act, setAct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only play for first-time visitors.
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      /* localStorage blocked — just skip the intro */
    }
  }, []);

  const finish = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setLeaving(true);
    setTimeout(() => setShow(false), 900); // match babel-veil-out
  }, []);

  // Auto-advance through the acts.
  useEffect(() => {
    if (!show || leaving) return;
    if (act >= TOTAL_ACTS) {
      finish();
      return;
    }
    timerRef.current = setTimeout(() => setAct((a) => a + 1), ACTS[act].ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, act, leaving, finish]);

  // Escape = skip.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, finish]);

  // Falling-character columns for atmosphere (stable across renders).
  const rainCols = useMemo(() => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz, .';
    // deterministic-ish layout without Math.random on every render
    return Array.from({ length: 24 }, (_, i) => {
      const chars = Array.from({ length: 20 }, (_, j) => alphabet[(i * 7 + j * 13) % alphabet.length]).join('');
      return {
        left: (i / 24) * 100,
        delay: (i % 8) * 1.1,
        duration: 12 + (i % 5) * 3,
        chars,
      };
    });
  }, []);

  if (!show) return null;

  const current = ACTS[Math.min(act, TOTAL_ACTS - 1)];

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] bg-babel-void flex items-center justify-center overflow-hidden ${
        leaving ? 'babel-veil-out' : ''
      }`}
    >
      {/* Falling character rain */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-40">
        {rainCols.map((c, i) => (
          <div
            key={i}
            className="babel-rain-col absolute top-0 font-mono text-babel-gold/40 text-xs leading-4 whitespace-pre"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              writingMode: 'vertical-rl',
            }}
          >
            {c.chars}
          </div>
        ))}
      </div>

      {/* Warm aura behind the text */}
      <div className="absolute w-[70vw] h-[70vw] max-w-3xl max-h-3xl rounded-full bg-babel-gold/5 blur-3xl babel-aura pointer-events-none" />

      {/* Skip — always available */}
      <button
        onClick={finish}
        className="absolute top-6 right-6 z-10 flex items-center gap-2 text-babel-dust hover:text-babel-gold border border-babel-lines/40 hover:border-babel-gold px-4 py-2 rounded text-xs tracking-widest uppercase font-mono transition-colors"
      >
        Skip intro
      </button>

      {/* The act */}
      <div key={act} className="babel-act relative z-[1] text-center px-6 max-w-3xl">
        {current.render()}
      </div>

      {/* Progress: one segment per act, current one fills over its duration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {ACTS.map((a, i) => (
          <div key={i} className="w-10 h-[2px] bg-babel-lines/40 overflow-hidden rounded-full">
            <div
              className="h-full bg-babel-gold"
              style={
                i < act
                  ? { transform: 'scaleX(1)', transformOrigin: 'left' }
                  : i === act && !leaving
                    ? { animationName: 'babel-progress', animationDuration: `${a.ms}ms`, animationTimingFunction: 'linear', animationFillMode: 'both' }
                    : { transform: 'scaleX(0)' }
              }
            />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
