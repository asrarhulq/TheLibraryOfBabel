'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Crown, Heart, ScrollText, Sparkles, ExternalLink,
  BookMarked, MapPin, Users, Clock, Send, X, MessageCircle, Compass
} from 'lucide-react';
import { DeclarationDoc, DiscoveryDoc } from '@/lib/babel/types';
import { getLocalName } from '@/lib/traveler/client';

interface HallData {
  declarations: DeclarationDoc[];
  discoveries: DiscoveryDoc[];
  daily: { today: string } | null;
}

const KIND_ICON: Record<string, React.ReactNode> = {
  love: <Heart size={12} />,
  future: <Clock size={12} />,
  anniversary: <Heart size={12} />,
  other: <Sparkles size={12} />,
};

function declarationHeadline(d: DeclarationDoc): string {
  if (d.kind === 'love') return `${d.from || 'Someone'} loves ${d.to || 'someone'}`;
  if (d.kind === 'anniversary') return d.dateLabel || d.phrase;
  if (d.kind === 'future') return 'A letter to the future';
  return d.message || d.phrase || 'These words, forever';
}

// ── Floating traveler names ──────────────────────────────────────────────────

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
      opacity: 0.10 + Math.random() * 0.18,
      size: (['sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 3)],
    });
  }
  return result;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  _id?: string;
  author: string;
  message: string;
  timestamp: number;
}

export default function HallPage() {
  const [data, setData] = useState<HallData | null>(null);
  const [loading, setLoading] = useState(true);

  // Floating names
  const [floatingNames, setFloatingNames] = useState<FloatingName[]>([]);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [authorName] = useState(() => getLocalName() || 'Traveler');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load hall data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/hall');
        const json = await res.json();
        if (!cancelled) setData(json as HallData);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load floating names
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/travelers/names');
        const data = await res.json();
        const travelers = (data?.travelers || []) as TravelerName[];
        setFloatingNames(generateFloatingNames(travelers, 30));
      } catch {
        setFloatingNames(generateFloatingNames([], 6));
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

  // Load chat
  const loadChat = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      const j = await res.json();
      setMessages((j?.messages || []) as ChatMessage[]);
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
    if (s === 'sm') return 'text-[10px]';
    if (s === 'lg') return 'text-base md:text-lg';
    return 'text-xs md:text-sm';
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment relative">
      {/* Floating names — behind everything */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

      <div className="max-w-4xl mx-auto p-6 md:p-10 babel-rise-in relative z-10">
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm font-mono mb-8">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        <div className="text-center mb-12">
          <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
            The Great Hall
          </p>
          <h1 className="text-3xl md:text-4xl text-babel-gold font-mono tracking-widest uppercase mb-4 babel-breathe flex items-center justify-center gap-3">
            <Users size={30} /> The Great Hall
          </h1>
          <p className="text-babel-parchment/80 font-serif italic text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            A gathering place for travelers of the infinite Library. See what others have found,
            declared, and claimed.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-babel-dust animate-pulse font-mono">Opening the great doors…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Chamber */}
            <div className="lg:col-span-2 bg-black/30 border border-babel-gold/30 rounded p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left flex-1">
                <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-1 font-mono">
                  <Sparkles size={10} className="inline mr-1" /> Daily Chamber
                </p>
                <p className="text-babel-gold font-mono text-lg tracking-widest">
                  Visit today's chamber — a new room every day
                </p>
                <p className="text-babel-dust/60 text-xs mt-1">
                  {data?.daily?.today ? `Today: ${data.daily.today}` : 'A fresh chamber awaits'}
                </p>
              </div>
              <Link
                href="/daily"
                className="shrink-0 flex items-center gap-2 bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold px-5 py-3 transition-all uppercase tracking-widest font-mono text-sm rounded"
              >
                Enter <ExternalLink size={14} />
              </Link>
            </div>

            {/* Recent Declarations */}
            <div className="bg-black/30 border border-babel-lines/20 rounded p-6">
              <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                <Heart size={16} /> Recent Declarations
              </h2>
              {data?.declarations && data.declarations.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.declarations.slice(0, 4).map((d) => (
                    <Link
                      key={d.id}
                      href={`/d/${d.id}`}
                      className="flex items-start gap-3 p-3 rounded border border-babel-lines/10 hover:border-babel-gold/40 hover:bg-babel-gold/5 transition-all group"
                    >
                      <span className="text-babel-gold/60 shrink-0 mt-0.5">
                        {KIND_ICON[d.kind] || <Sparkles size={12} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-babel-parchment text-sm font-serif group-hover:text-babel-gold transition-colors truncate">
                          {declarationHeadline(d)}
                        </p>
                        <p className="text-babel-dust/50 text-[10px] mt-0.5 font-mono">
                          {d.coord.roomId}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-babel-dust/60 text-sm italic">No public declarations yet.</p>
              )}
              <Link href="/wall" className="inline-flex items-center gap-1 text-babel-gold/70 hover:text-babel-gold text-xs uppercase tracking-widest mt-4 transition-colors">
                View all <ScrollText size={12} />
              </Link>
            </div>

            {/* Recent Discoveries */}
            <div className="bg-black/30 border border-babel-lines/20 rounded p-6">
              <h2 className="text-babel-gold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                <BookMarked size={16} /> Saved by Travelers
              </h2>
              {data?.discoveries && data.discoveries.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.discoveries.slice(0, 4).map((d, i) => (
                    <Link
                      key={`${d.coord.roomId}-${d.coord.page}-${i}`}
                      href={`/room/${d.coord.roomId}/${d.coord.wall}/${d.coord.shelf}/${d.coord.book}/${d.coord.page}`}
                      className="flex items-start gap-3 p-3 rounded border border-babel-lines/10 hover:border-babel-gold/40 hover:bg-babel-gold/5 transition-all group"
                    >
                      <MapPin size={14} className="text-babel-gold/60 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-babel-parchment text-sm group-hover:text-babel-gold transition-colors truncate">
                          {d.name} saved: {d.label || d.text || 'a page'}
                        </p>
                        <p className="text-babel-dust/50 text-[10px] mt-0.5 font-mono">
                          {d.coord.roomId} · p.{d.coord.page}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-babel-dust/60 text-sm italic">No saved pages shared yet.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/search"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <Sparkles size={22} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Search</span>
              </Link>
              <Link
                href="/oracle"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🔮</span>
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Oracle</span>
              </Link>
              <Link
                href="/immortalize"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <Heart size={22} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Immortalize</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex flex-col items-center gap-2 p-5 bg-black/30 border border-babel-lines/20 rounded hover:border-babel-gold/50 hover:bg-babel-gold/5 transition-all group text-center"
              >
                <Crown size={22} className="text-babel-gold group-hover:scale-110 transition-transform" />
                <span className="text-babel-parchment text-xs uppercase tracking-widest group-hover:text-babel-gold transition-colors">Keepers</span>
              </Link>
            </div>

            {/* Borges quote */}
            <div className="lg:col-span-2 text-center mt-4 pb-24">
              <p className="text-babel-dust/40 text-xs italic font-serif leading-relaxed">
                &ldquo;The Library is unlimited and cyclical. If an eternal traveler were to cross it in any
                direction, he would see after centuries that the same volumes are repeated in the same
                disorder — which, repeated, would be an order: the Order.&rdquo;
              </p>
              <p className="text-babel-dust/30 text-[10px] mt-2 uppercase tracking-widest">
                — Jorge Luis Borges, The Library of Babel
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat toggle + panel — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-black/80 border border-babel-lines/40 hover:border-babel-gold text-babel-parchment/80 hover:text-babel-gold rounded-full transition-all text-xs tracking-widest uppercase backdrop-blur-sm"
          >
            <MessageCircle size={16} /> Chat
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-[#0a0a0f]/95 border border-babel-lines/30 rounded-lg shadow-2xl backdrop-blur-md flex flex-col max-h-[420px]">
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
    </div>
  );
}