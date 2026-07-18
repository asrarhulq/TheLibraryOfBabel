'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz, .';
const HEX = '0123456789abcdef';

interface Coord {
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

interface Props {
  query: string;
  coord: Coord;
  onArrive: () => void; // called when the descent finishes (navigate then)
}

// A cinematic "fall through the infinite" shown between search and arrival:
//   Act 1 — the phrase transmutes into a coordinate (encoding)
//   Act 2 — a rush of characters/light streaks past as we plunge (the fall)
//   Act 3 — deceleration; the address crystallizes; hand off to the room
export default function SearchDescent({ query, coord, onArrive }: Props) {
  const [phase, setPhase] = useState<'encode' | 'fall' | 'arrive'>('encode');
  const [revealed, setRevealed] = useState(0); // chars of the address revealed
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const phaseRef = useRef<'encode' | 'fall' | 'arrive'>('encode'); // latest phase for the raf loop

  const address = `${coord.roomId}`;
  const fullLocation = `${coord.roomId} · ${coord.wall}/${coord.shelf}/${coord.book}/${coord.page}`;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onArrive();
  };

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // ── Phase timeline ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (reduced) {
      // Respect reduced motion — brief pause, then go.
      const t = setTimeout(finish, 500);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Reveal the coordinate over a FIXED ~1.5s window regardless of length, so long
    // coordinates don't drag. Step through characters proportionally.
    const revealWindow = 1500;
    const step = Math.max(20, revealWindow / Math.max(1, address.length));
    address.split('').forEach((_, i) => {
      timers.push(setTimeout(() => setRevealed(i + 1), 150 + i * step));
    });
    const encodeMs = 150 + revealWindow + 500; // ~2.15s of encode
    timers.push(setTimeout(() => setPhase('fall'), encodeMs));
    timers.push(setTimeout(() => setPhase('arrive'), encodeMs + 1700));
    timers.push(setTimeout(finish, encodeMs + 2900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── The falling starfield / character stream (Canvas) ──────────────────────
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Streaks radiating from the centre — a warp-speed plunge into the void.
    const N = Math.min(320, Math.floor((w * h) / 6000));
    const cx = () => w / 2;
    const cy = () => h / 2;
    const stars = Array.from({ length: N }, () => spawn());
    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      return {
        angle,
        dist: Math.random() * 40 + 4, // start near centre
        speed: Math.random() * 2 + 1,
        char: Math.random() < 0.35 ? ALPHABET[Math.floor(Math.random() * ALPHABET.length)] : '',
        len: Math.random() * 30 + 8,
      };
    }

    const draw = () => {
      // velocity ramps: gentle in encode, fast in fall, easing in arrive
      const p = phaseRef.current;
      const vel = p === 'fall' ? 1 : p === 'arrive' ? 0.35 : 0.5;
      // motion-blur trail
      ctx.fillStyle = 'rgba(8,9,12,0.28)';
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const prev = s.dist;
        s.dist += s.speed * vel * (1 + s.dist / 120);
        const x1 = cx() + Math.cos(s.angle) * prev;
        const y1 = cy() + Math.sin(s.angle) * prev;
        const x2 = cx() + Math.cos(s.angle) * (s.dist + s.len * vel);
        const y2 = cy() + Math.sin(s.angle) * (s.dist + s.len * vel);

        const edge = Math.max(w, h) * 0.75;
        const fade = Math.min(1, s.dist / 180);
        ctx.strokeStyle = `rgba(212,175,55,${0.15 + fade * 0.5})`;
        ctx.lineWidth = 0.6 + fade * 1.4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (s.char && fade > 0.3 && Math.random() < 0.08) {
          ctx.fillStyle = `rgba(244,241,234,${fade * 0.5})`;
          ctx.font = '11px monospace';
          ctx.fillText(s.char, x2, y2);
        }

        if (s.dist > edge) Object.assign(s, spawn());
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the raf loop's phase reference in sync with React state
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-babel-void overflow-hidden flex items-center justify-center cursor-pointer"
      onClick={finish}
      title="Click to skip"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Radial vignette to focus the centre */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 30%, rgba(8,9,12,0.75) 75%)',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-2xl">
        {phase === 'encode' && (
          <div className="babel-fade-in">
            <p className="font-sans text-babel-dust/70 text-xs tracking-[0.3em] uppercase mb-6">
              Your words become a number… the number becomes a place
            </p>
            <p className="font-serif italic text-babel-parchment text-xl md:text-2xl mb-8 break-words">
              &ldquo;{query}&rdquo;
            </p>
            <p className="font-mono text-babel-gold text-lg md:text-2xl tracking-widest break-all">
              {address.slice(0, revealed)}
              <span className="opacity-40">
                {address
                  .slice(revealed)
                  .split('')
                  .map((c) => (c === '-' ? '-' : HEX[Math.floor(Math.random() * HEX.length)]))
                  .join('')}
              </span>
            </p>
          </div>
        )}

        {phase === 'fall' && (
          <p className="font-mono text-babel-gold/80 text-sm md:text-base tracking-[0.4em] uppercase babel-fade-in">
            Descending
          </p>
        )}

        {phase === 'arrive' && (
          <div className="babel-fade-in">
            <p className="font-sans text-babel-gold-dim text-[10px] tracking-[0.4em] uppercase mb-4">
              Chamber found
            </p>
            <p className="font-mono text-babel-gold text-base md:text-xl tracking-widest break-all babel-breathe">
              {fullLocation}
            </p>
          </div>
        )}
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-babel-dust/40 text-[10px] tracking-widest uppercase font-mono">
        Click to skip
      </p>
    </div>,
    document.body
  );
}
