'use client';

import React, { useRef, useEffect } from 'react';
import { isEnglishWord } from '@/lib/babel/dictionary';
import { Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { getEngine } from '@/lib/audio/SoundEngine';

interface BookReaderProps {
  text: string;
  searchQuery?: string;
  roomId: string;
  page: number;
}

export default function BookReader({ text, searchQuery = '', roomId, page }: BookReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Play a page turn sound when the text updates, and set the room audio
  useEffect(() => {
    const eng = getEngine();
    eng.setRoom(roomId);
    eng.playPageTurn(roomId, page);
  }, [text, roomId, page]);

  // Find all words in the text to highlight
  const intervals: { start: number; end: number; type: 'word' | 'query' }[] = [];

  // Search explicitly for the searched phrase
  if (searchQuery && searchQuery.length > 0) {
    const queryIndex = text.indexOf(searchQuery);
    if (queryIndex !== -1) {
      intervals.push({ start: queryIndex, end: queryIndex + searchQuery.length, type: 'query' });
    }
  }

  for (let i = 0; i < text.length; i++) {
    // If this index is already covered by a query, skip it
    if (intervals.some(interval => i >= interval.start && i < interval.end)) {
      continue;
    }

    for (let len = 15; len >= 4; len--) {
      if (i + len <= text.length) {
        const sub = text.substring(i, i + len);
        if (/^[a-z]+$/.test(sub) && isEnglishWord(sub)) {
          // Check for overlap
          const overlaps = intervals.some(interval => 
            (i >= interval.start && i < interval.end) || 
            (i + len > interval.start && i + len <= interval.end)
          );

          if (!overlaps) {
            intervals.push({ start: i, end: i + len, type: 'word' });
            i += len - 1;
            break;
          }
        }
      }
    }
  }

  // Sort intervals by start index
  intervals.sort((a, b) => a.start - b.start);

  const nodes = [];
  let lastIndex = 0;

  for (const interval of intervals) {
    if (interval.start > lastIndex) {
      nodes.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, interval.start)}</span>);
    }
    nodes.push(
      <span 
        key={`highlight-${interval.start}`} 
        className={interval.type === 'query' 
          ? "text-white bg-babel-gold/20 font-bold drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] underline underline-offset-4" 
          : "text-babel-gold font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"
        }
      >
        {text.substring(interval.start, interval.end)}
      </span>
    );
    lastIndex = interval.end;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  const handleExport = async () => {
    if (contentRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(contentRef.current, {
          backgroundColor: '#0a0a0c',
          style: { padding: '40px' }
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
      <button 
        onClick={handleExport}
        className="absolute top-4 right-8 z-10 flex items-center gap-2 text-xs uppercase tracking-widest text-babel-dust hover:text-babel-gold border border-babel-lines/30 hover:border-babel-gold px-3 py-2 rounded transition-colors bg-[#0a0a0c]"
      >
        <Download size={14} /> Export PNG
      </button>
      
      <div 
        ref={contentRef}
        className="w-full h-full p-8 md:p-16 pt-20 overflow-y-auto font-mono text-sm md:text-base leading-relaxed tracking-wider whitespace-pre-wrap"
      >
        {nodes}
      </div>
    </div>
  );
}
