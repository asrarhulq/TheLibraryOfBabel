'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { isEnglishWord } from '@/lib/babel/dictionary';
import { detectRarities, Rarity } from '@/lib/babel/rarity';
import { Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { getEngine } from '@/lib/audio/SoundEngine';
import { getLocalName, travelerApi } from '@/lib/traveler/client';
import { useToast } from '@/components/ToastProvider';
import ShareCard from '@/components/ShareCard';

interface BookReaderProps {
  text: string;
  searchQuery?: string;
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

type Interval = { start: number; end: number; type: 'word' | 'query' | 'rarity'; rarity?: Rarity };

export default function BookReader({ text, searchQuery = '', roomId, wall, shelf, book, page }: BookReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { pushAchievements, pushRarity } = useToast();

  const coord = { roomId, wall, shelf, book, page };

  // The traveler's saved name (client-only) feeds the "find your own name" rarity.
  const travelerName = typeof window !== 'undefined' ? getLocalName() : '';

  // Heavy text analysis — rarity detection + the full word scan over 3,200 chars — is
  // expensive, so memoize it. It only depends on the page text, the searched phrase, and
  // the traveler name; it must NOT re-run on unrelated re-renders (toasts, hover, etc.).
  const { rarities, intervals, wordCount } = useMemo(() => {
    const found = detectRarities(text, travelerName);
    const ivs: Interval[] = [];

    if (searchQuery && searchQuery.length > 0) {
      const queryIndex = text.indexOf(searchQuery);
      if (queryIndex !== -1) {
        ivs.push({ start: queryIndex, end: queryIndex + searchQuery.length, type: 'query' });
      }
    }

    // Rarities take precedence over ordinary word highlights.
    for (const r of found) {
      const overlaps = ivs.some((iv) => r.start < iv.end && r.end > iv.start);
      if (!overlaps) ivs.push({ start: r.start, end: r.end, type: 'rarity', rarity: r });
    }

    let count = 0;
    for (let i = 0; i < text.length; i++) {
      if (ivs.some((interval) => i >= interval.start && i < interval.end)) continue;
      for (let len = 15; len >= 4; len--) {
        if (i + len <= text.length) {
          const sub = text.substring(i, i + len);
          if (/^[a-z]+$/.test(sub) && isEnglishWord(sub)) {
            const overlaps = ivs.some(
              (interval) =>
                (i >= interval.start && i < interval.end) ||
                (i + len > interval.start && i + len <= interval.end)
            );
            if (!overlaps) {
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

  // ---- Report progress to the DB (fire-and-forget) ----
  useEffect(() => {
    const eng = getEngine();
    eng.setRoom(roomId);
    eng.playPageTurn(roomId, page);

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

      // Log each rarity; the first time one is seen, celebrate it.
      const name = getLocalName() || 'Anonymous Traveler';
      for (const r of rarities) {
        const res = await travelerApi.rarity(coord, name, {
          kind: r.kind,
          text: r.text,
          weight: r.weight,
        });
        if (cancelled) break;
        if (res?.isNew) {
          pushRarity(r.label, r.text);
          if (res.newlyUnlocked?.length) pushAchievements(res.newlyUnlocked);
        }
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
        <ShareCard
          searchQuery={searchQuery}
          rarities={rarities.map((r) => r.text)}
          coord={coord}
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-babel-dust hover:text-babel-gold border border-babel-lines/30 hover:border-babel-gold px-3 py-2 rounded transition-colors bg-[#0a0a0c]"
        >
          <Download size={14} /> Export PNG
        </button>
      </div>

      <div
        ref={contentRef}
        className="w-full h-full p-8 md:p-16 pt-20 overflow-y-auto font-mono text-sm md:text-base leading-relaxed tracking-wider whitespace-pre-wrap"
      >
        {nodes}
      </div>
    </div>
  );
}
