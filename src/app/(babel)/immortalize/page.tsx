'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as htmlToImage from 'html-to-image';
import { ArrowLeft, Heart, Clock, CalendarHeart, Sparkles, Check, Copy, MapPin, Download } from 'lucide-react';
import { DeclarationDoc, DeclarationKind } from '@/lib/babel/types';
import DeclarationCertificate from '@/components/DeclarationCertificate';

const MODES: { kind: DeclarationKind; label: string; icon: React.ReactNode; blurb: string }[] = [
  { kind: 'future', label: 'Future Self', icon: <Clock size={16} />, blurb: 'A message waiting for you to return.' },
  { kind: 'anniversary', label: 'A Moment', icon: <CalendarHeart size={16} />, blurb: 'A date or occasion, kept in the stacks.' },
  { kind: 'love', label: 'A Love', icon: <Heart size={16} />, blurb: 'Two names, bound at a coordinate forever.' },
  { kind: 'other', label: 'Other', icon: <Sparkles size={16} />, blurb: 'Any words at all — immortalize them.' },
];

export default function ImmortalizePage() {
  const [kind, setKind] = useState<DeclarationKind>('future');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DeclarationDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const shareUrl =
    result && typeof window !== 'undefined' ? `${window.location.origin}/d/${result.id}` : '';
  const roomUrl = result
    ? `/room/${result.coord.roomId}/${result.coord.wall}/${result.coord.shelf}/${result.coord.book}/${result.coord.page}`
    : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, from, to, dateLabel, message, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Something went wrong.');
      } else {
        setResult(data.declaration as DeclarationDoc);
      }
    } catch {
      setError('Could not reach the Library.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadCard = async () => {
    if (!certRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(certRef.current, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.download = 'babel-declaration.png';
      a.href = dataUrl;
      a.click();
    } catch {
      /* ignore */
    }
  };

  const reset = () => {
    setResult(null);
    setFrom('');
    setTo('');
    setDateLabel('');
    setMessage('');
    setIsPublic(false);
  };

  const inputCls =
    'w-full bg-black/50 border border-babel-lines/50 p-3 text-babel-parchment focus:outline-none focus:border-babel-gold focus:bg-black/80 transition-colors placeholder:text-babel-dust/60';

  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment">
      <div className="max-w-xl mx-auto p-6 md:p-10 babel-rise-in">
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8 font-mono">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        {!result ? (
          <>
            <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
              Immortalize
            </p>
            <h1 className="text-3xl md:text-4xl text-babel-gold font-mono tracking-widest uppercase mb-4 babel-breathe">
              Find It in the Infinite
            </h1>
            <p className="text-babel-parchment/80 font-serif italic text-base md:text-lg leading-relaxed mb-8">
              You are not writing these words — in a library of every possible text, they already
              exist. We will simply calculate where, and mark it with your message forever.
            </p>

            {/* Mode selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              {MODES.map((m) => (
                <button
                  key={m.kind}
                  onClick={() => setKind(m.kind)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                    kind === m.kind
                      ? 'border-babel-gold bg-babel-gold/10 text-babel-gold'
                      : 'border-babel-lines/30 text-babel-dust hover:border-babel-gold/50'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              {kind === 'love' && (
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input className={inputCls} placeholder="Your name" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} required />
                  <span className="text-babel-gold font-serif italic shrink-0">loves</span>
                  <input className={inputCls} placeholder="Their name" value={to} onChange={(e) => setTo(e.target.value)} maxLength={40} required />
                </div>
              )}

              {kind === 'anniversary' && (
                <input className={inputCls} placeholder="The moment — e.g. the day we met" value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} maxLength={40} required />
              )}

              {(kind === 'future' || kind === 'other') && (
                <input className={inputCls} placeholder="Sign it (your name, optional)" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} />
              )}

              <textarea
                className={`${inputCls} resize-none h-28`}
                placeholder={
                  kind === 'love'
                    ? 'A message for them…'
                    : kind === 'future'
                      ? 'Dear future me…'
                      : kind === 'other'
                        ? 'Any words you want to immortalize…'
                        : 'What made this moment matter…'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                required={kind === 'future' || kind === 'other'}
              />

              <label className="flex items-center gap-3 text-sm text-babel-dust cursor-pointer select-none">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-babel-gold w-4 h-4" />
                Also share on the public <span className="text-babel-gold">Wall of Declarations</span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold p-4 transition-all uppercase tracking-widest font-mono disabled:opacity-50 mt-2"
              >
                {busy ? 'Locating in the infinite…' : 'Immortalize'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center babel-fade-in">
            <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
              It is written
            </p>
            <h2 className="text-2xl md:text-3xl text-babel-gold font-mono tracking-widest uppercase mb-6">
              Found & Sealed
            </h2>

            <DeclarationCertificate ref={certRef} d={result} />

            <div className="w-full mt-8 flex flex-col gap-3">
              <button onClick={copyLink} className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-mono text-babel-gold border border-babel-gold/50 hover:bg-babel-gold/10 px-4 py-3 rounded transition-colors">
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Link copied!' : 'Copy share link'}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadCard} className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-mono text-babel-dust border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold px-4 py-3 rounded transition-colors">
                  <Download size={15} /> Card
                </button>
                <Link href={roomUrl} className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-mono text-babel-dust border border-babel-lines/40 hover:border-babel-gold hover:text-babel-gold px-4 py-3 rounded transition-colors">
                  <MapPin size={15} /> Visit it
                </Link>
              </div>
              <button onClick={reset} className="text-babel-dust/60 hover:text-babel-gold text-xs uppercase tracking-widest font-mono mt-2 transition-colors">
                Immortalize another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
