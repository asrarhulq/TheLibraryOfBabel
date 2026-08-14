'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { isEnglishWord } from '@/lib/babel/dictionary';
import { detectRarities, Rarity } from '@/lib/babel/rarity';
import { Download, Bookmark, BookmarkCheck } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { getEngine } from '@/lib/audio/SoundEngine';
import { getLocalName, travelerApi } from '@/lib/traveler/client';
import { useToast } from '@/components/ToastProvider';
import ShareCard from '@/components/ShareCard';

import { useRouter } from 'next/navigation';

interface BookReaderProps {
  text: string;
  searchQuery?: string;
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
  prevPage?: string | null;
  nextPage?: string | null;
}

type Interval = { start: number; end: number; type: 'word' | 'query' | 'rarity'; rarity?: Rarity };

export default function BookReader({ text, searchQuery = '', roomId, wall, shelf, book, page, prevPage, nextPage }: BookReaderProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const { pushAchievements, pushRarity } = useToast();

  const coord = { roomId, wall, shelf, book, page };

  // Prefetch prev/next pages for instantaneous page turns
  useEffect(() => {
    if (prevPage) router.prefetch(prevPage);
    if (nextPage) router.prefetch(nextPage);
  }, [prevPage, nextPage, router]);

  // Keyboard navigation for arrow left / arrow right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowLeft' && prevPage) {
        e.preventDefault();
        router.push(prevPage);
      } else if (e.key === 'ArrowRight' && nextPage) {
        e.preventDefault();
        router.push(nextPage);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPage, nextPage, router]);

  // The traveler's saved name (client-only) feeds the "find your own name" rarity.
  const travelerName = typeof window !== 'undefined' ? getLocalName() : '';

  // Heavy text analysis — rarity detection + the full word scan over 3,200 chars — is
  // expensive, so memoize it. It only depends on the page text, the searched phrase, and
  // the traveler name; it must NOT re-run on unrelated re-renders (toasts, hover, etc.).
  const { rarities, intervals, wordCount } = useMemo(() => {
    const found = detectRarities(text, travelerName);
    const ivs: Interval[] = [];

    // The searched phrase (white) is added FIRST and always wins — every occurrence.
    // The page text has a newline inserted every 80 chars for formatting, so a long phrase
    // can be split by a '\n'. We therefore match against a newline-stripped copy and map
    // the position back to the original text (the highlighted span may span a line break,
    // which simply renders as a wrapped white highlight).
    if (searchQuery && searchQuery.length > 0) {
      // stripped[k] = character at original index origIdx[k], with newlines removed
      const origIdx: number[] = [];
      let stripped = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] !== '\n') {
          stripped += text[i];
          origIdx.push(i);
        }
      }
      let from = stripped.indexOf(searchQuery);
      while (from !== -1) {
        const start = origIdx[from];
        const lastCharOrig = origIdx[from + searchQuery.length - 1];
        ivs.push({ start, end: lastCharOrig + 1, type: 'query' });
        from = stripped.indexOf(searchQuery, from + searchQuery.length);
      }
    }

    // Proper interval-overlap test: [a,b) overlaps [c,d) iff a < d && c < b.
    const overlapsExisting = (start: number, end: number) =>
      ivs.some((iv) => start < iv.end && iv.start < end);

    // Rarities take precedence over ordinary word highlights (but not over the query).
    for (const r of found) {
      if (!overlapsExisting(r.start, r.end)) {
        ivs.push({ start: r.start, end: r.end, type: 'rarity', rarity: r });
      }
    }

    let count = 0;
    for (let i = 0; i < text.length; i++) {
      // Skip any index already inside a claimed interval (query/rarity/word).
      if (ivs.some((iv) => i >= iv.start && i < iv.end)) continue;
      for (let len = 15; len >= 4; len--) {
        if (i + len <= text.length) {
          const sub = text.substring(i, i + len);
          if (/^[a-z]+$/.test(sub) && isEnglishWord(sub)) {
            if (!overlapsExisting(i, i + len)) {
              ivs.push({ start: i, end: i + len, type: 'word' });
              count++;
              i += len - 1;
              break;
            }
          }
        }
      }
    }

    ivs.sort((a, b) => a.start - b.start);
    return { rarities: found, intervals: ivs, wordCount: count };
  }, [text, searchQuery, travelerName]);

  // ---- Track the visit (personal stats only) + gently reveal any rarity ----
  // NOTE: rarities are NO LONGER auto-saved to discoveries. They're only celebrated
  // with a toast; the visitor chooses what to keep via the "Save this page" button.
  useEffect(() => {
    const eng = getEngine();
    eng.setRoom(roomId);
    eng.playPageTurn(roomId, page);
    setSaved(false); // reset save state for the new page

    let cancelled = false;
    const totalWords = wordCount + rarities.length;

    (async () => {
      const isDaily =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('daily') === '1';

      const v = await travelerApi.visit(coord, isDaily);
      if (!cancelled && v?.newlyUnlocked?.length) pushAchievements(v.newlyUnlocked);

      const w = await travelerApi.words(coord, totalWords);
      if (!cancelled && w?.newlyUnlocked?.length) pushAchievements(w.newlyUnlocked);

      // Celebrate the rarest find on this page (visual only — not persisted).
      if (!cancelled && rarities.length > 0) {
        const top = rarities[0];
        pushRarity(top.label, top.text);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, roomId, page, wall, shelf, book]);

  // ---- Render nodes (memoized: only rebuild when the analysis changes) ----
  const nodes = useMemo(() => {
    const out: React.ReactNode[] = [];
    let lastIndex = 0;
    for (const interval of intervals) {
      if (interval.start > lastIndex) {
        out.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, interval.start)}</span>);
      }
      let cls = 'text-babel-gold font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]';
      if (interval.type === 'query') {
        cls =
          'text-white bg-babel-gold/20 font-bold drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] underline underline-offset-4';
      } else if (interval.type === 'rarity') {
        cls =
          'text-babel-gold font-bold bg-babel-gold/10 px-0.5 rounded-sm babel-rarity underline decoration-babel-gold/60 underline-offset-4';
      }
      out.push(
        <span
          key={`highlight-${interval.start}`}
          className={cls}
          title={interval.rarity ? `✦ ${interval.rarity.label}` : undefined}
        >
          {text.substring(interval.start, interval.end)}
        </span>
      );
      lastIndex = interval.end;
    }
    if (lastIndex < text.length) {
      out.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    return out;
  }, [intervals, text]);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSavePage = async () => {
    if (saved || saving) return;
    setSaving(true);
    const name = getLocalName() || 'Anonymous Traveler';
    const label = searchQuery || rarities[0]?.text || `${roomId} · p${page}`;
    const res = await travelerApi.savePage(
      coord,
      name,
      label,
      rarities.map((r) => ({ kind: r.kind, text: r.text, weight: r.weight }))
    );
    if (res) {
      setSaved(true);
      if (res.newlyUnlocked?.length) pushAchievements(res.newlyUnlocked);
    }
    setSaving(false);
  };

  const handleExport = async () => {
    if (contentRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(contentRef.current, {
          backgroundColor: '#0a0a0c',
          style: { padding: '40px' },
        });
        const link = document.createElement('a');
        link.download = 'book-of-babel-page.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to export image', err);
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-8 z-10 flex items-center gap-2">
        {rarities.length > 0 && (
          <span className="text-[10px] uppercase tracking-widest text-babel-gold border border-babel-gold/50 px-2 py-1 rounded bg-babel-gold/10 babel-rarity">
            ✦ {rarities.length} {rarities.length === 1 ? 'rarity' : 'rarities'} on this page
          </span>
        )}
        <button
          onClick={handleSavePage}
          disabled={saving}
          className={`flex items-center gap-2 text-xs uppercase tracking-widest border px-3 py-2 rounded transition-colors bg-[#0a0a0c] disabled:opacity-60 ${
            saved
              ? 'text-babel-gold border-babel-gold'
              : 'text-babel-dust hover:text-babel-gold border-babel-lines/30 hover:border-babel-gold'
          }`}
          title="Save this page to your discoveries"
        >
          {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          <span className="hidden sm:inline">{saved ? 'Saved' : 'Save page'}</span>
        </button>
        <ShareCard
          searchQuery={searchQuery}
          rarities={rarities.map((r) => r.text)}
          coord={coord}
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-babel-dust hover:text-babel-gold border border-babel-lines/30 hover:border-babel-gold px-3 py-2 rounded transition-colors bg-[#0a0a0c]"
        >
          <Download size={14} /> <span className="hidden sm:inline">Export PNG</span>
        </button>
      </div>

      <div
        key={`${roomId}-${wall}-${shelf}-${book}-${page}`}
        ref={contentRef}
        className="w-full h-full p-8 md:p-16 pt-20 overflow-y-auto font-mono text-sm md:text-base leading-relaxed tracking-wider whitespace-pre-wrap babel-fade-in gpu-accelerated"
      >
        {nodes}
      </div>
    </div>
  );
}
