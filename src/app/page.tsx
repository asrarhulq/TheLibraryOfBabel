'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getLocalName } from '@/lib/traveler/client';
import {
  Search, Sparkles, Heart, Users, BookMarked, Send, X,
  MessageCircle, Compass
} from 'lucide-react';

// ── Floating traveler name ──────────────────────────────────────────────────

interface TravelerName {
  name: string;
  score: number;
  chambersVisited: number;
}

interface FloatingName {
  id: string;
  name: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  opacity: number;
  size: 'sm' | 'md' | 'lg';
}

function generateFloatingNames(travelers: TravelerName[], count: number): FloatingName[] {
  const pool = travelers.length > 0 ? travelers : [{ name: 'Awaiting travelers…', score: 0, chambersVisited: 0 }];
  const result: FloatingName[] = [];
  for (let i = 0; i < Math.min(count, pool.length * 3); i++) {
    const t = pool[Math.floor(Math.random() * pool.length)];
    result.push({
      id: `${t.name}-${i}-${Math.random().toString(36).slice(2)}`,
      name: t.name,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dx: (Math.random() - 0.5) * 0.03,
      dy: (Math.random() - 0.5) * 0.03,
      opacity: 0.15 + Math.random() * 0.25,
      size: (['sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 3)],
    });
  }
  return result;
}

// ── Chat message ─────────────────────────────────────────────────────────────

interface ChatMessage {
  _id?: string;
  author: string;
  message: string;
  timestamp: number;
}

// ── Particles ────────────────────────────────────────────────────────────────

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animating = true;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.3 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      if (!animating) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      animating = false;
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

// ── Main Homepage ────────────────────────────────────────────────────────────

export default function HomePage() {
  const [floatingNames, setFloatingNames] = useState<FloatingName[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [authorName] = useState(() => getLocalName() || 'Traveler');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load floating names
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/travelers/names');
        const data = await res.json();
        const travelers = (data?.travelers || []) as TravelerName[];
        setFloatingNames(generateFloatingNames(travelers, 35));
      } catch {
        setFloatingNames(generateFloatingNames([], 8));
      }
    })();
  }, []);

  // Animate floating names
  useEffect(() => {
    if (floatingNames.length === 0) return;
    const interval = setInterval(() => {
      setFloatingNames((prev) =>
        prev.map((n) => {
          let nx = n.x + n.dx * 16;
          let ny = n.y + n.dy * 16;
          if (nx < -5) nx = 105;
          if (nx > 105) nx = -5;
          if (ny < -5) ny = 105;
          if (ny > 105) ny = -5;
          return { ...n, x: nx, y: ny };
        })
      );
    }, 50);
    return () => clearInterval(interval);
  }, [floatingNames.length]);

  // Load chat messages
  const loadChat = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setMessages((data?.messages || []) as ChatMessage[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 4000);
    return () => clearInterval(interval);
  }, [loadChat]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || chatBusy) return;
    setChatBusy(true);
    setChatInput('');
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: authorName, message: msg }),
      });
      await loadChat();
    } catch { /* ignore */ }
    setChatBusy(false);
  };

  const sizeClass = (s: 'sm' | 'md' | 'lg') => {
    if (s === 'sm') return 'text-xs';
    if (s === 'lg') return 'text-lg md:text-xl';
    return 'text-sm md:text-base';
  };

  return (
    <div className="w-full h-full relative bg-[#0a0a0f] overflow-hidden select-none">
      {/* Subtle particle field */}
      <Particles />

      {/* Floating names */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingNames.map((n) => (
          <span
            key={n.id}
            className={`absolute font-serif italic text-babel-gold whitespace-nowrap transition-none ${sizeClass(n.size)}`}
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              opacity: n.opacity,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {n.name}
          </span>
        ))}
      </div>

      {/* Central welcome */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl text-babel-gold font-mono tracking-[0.3em] uppercase mb-4 babel-breathe">
            The Library
          </h1>
          <p className="font-serif italic text-babel-parchment/60 text-sm md:text-base">
            Every book that could be written already waits here
          </p>
        </div>
      </div>

      {/* Navigation grid — bottom center */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 px-4 py-3 bg-black/50 border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold text-babel-parchment/80 rounded transition-all font-mono text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <Search size={14} /> Search
          </Link>
          <Link
            href="/oracle"
            className="flex items-center gap-2 px-4 py-3 bg-black/50 border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold text-babel-parchment/80 rounded transition-all font-mono text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <Sparkles size={14} /> Oracle
          </Link>
          <Link
            href="/hall"
            className="flex items-center gap-2 px-4 py-3 bg-black/50 border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold text-babel-parchment/80 rounded transition-all font-mono text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <Users size={14} /> Hall
          </Link>
          <Link
            href="/immortalize"
            className="flex items-center gap-2 px-4 py-3 bg-black/50 border border-babel-gold/40 hover:bg-babel-gold/10 text-babel-gold rounded transition-all font-mono text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <Heart size={14} /> Immortalize
          </Link>
          <Link
            href="/journal"
            className="flex items-center gap-2 px-4 py-3 bg-black/50 border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold text-babel-parchment/80 rounded transition-all font-mono text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <BookMarked size={14} /> Journal
          </Link>
        </div>
      </div>

      {/* Chat toggle + panel */}
      <div className="absolute bottom-6 right-6 pointer-events-auto z-30">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-black/70 border border-babel-lines/40 hover:border-babel-gold text-babel-parchment/80 hover:text-babel-gold rounded-full transition-all text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <MessageCircle size={16} /> Chat
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-[#0a0a0f]/95 border border-babel-lines/30 rounded-lg shadow-2xl backdrop-blur-md flex flex-col max-h-[420px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-babel-lines/20">
              <span className="text-babel-gold text-xs tracking-widest uppercase font-mono flex items-center gap-2">
                <Compass size={14} /> Travelers' Chat
              </span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-babel-dust hover:text-babel-parchment transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {messages.length === 0 && (
                <p className="text-babel-dust/50 text-xs italic text-center py-4">
                  No messages yet. Be the first to speak into the void.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={m._id || i} className="flex items-start gap-2">
                  <span className="text-babel-gold/70 text-[10px] font-mono shrink-0 mt-0.5">
                    {m.author.slice(0, 12)}:
                  </span>
                  <span className="text-babel-parchment/80 text-xs leading-relaxed break-words">
                    {m.message}
                  </span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendChat} className="flex items-center gap-2 px-3 py-3 border-t border-babel-lines/20">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Speak into the infinite…"
                maxLength={200}
                className="flex-1 bg-black/40 border border-babel-lines/30 rounded px-3 py-1.5 text-xs text-babel-parchment placeholder:text-babel-dust/50 focus:outline-none focus:border-babel-gold/60 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatBusy}
                className="text-babel-gold hover:text-babel-parchment disabled:opacity-30 transition-colors p-1"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Subtle footer */}
      <div className="absolute bottom-6 left-6 pointer-events-none z-10">
        <p className="text-babel-dust/30 text-[10px] font-mono tracking-widest uppercase">
          Drag to drift · click a chamber to enter
        </p>
      </div>
    </div>
  );
}