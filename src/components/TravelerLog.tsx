'use client';

import React, { useState, useEffect } from 'react';
import { PenLine, Send, LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { travelerApi, getLocalName, initSession, isSignedIn } from '@/lib/traveler/client';

interface TravelerLogProps {
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

interface Note {
  _id?: string;
  author: string;
  content: string;
  timestamp: number;
}

export default function TravelerLog({ roomId, wall, shelf, book, page }: TravelerLogProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const coord = { roomId, wall, shelf, book, page };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initSession();
      if (!cancelled) setSignedIn(isSignedIn());
      const res = await travelerApi.notes(coord);
      if (!cancelled && res?.notes) setNotes(res.notes as Note[]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, wall, shelf, book, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || saving || !signedIn) return;
    setSaving(true);
    // Name comes from the signed-in Google account.
    const res = await travelerApi.saveNote(coord, getLocalName() || 'Traveler', newNote.trim());
    if (res?.note) {
      setNotes((prev) => [...prev, res.note as Note]);
      setNewNote('');
    }
    setSaving(false);
  };

  return (
    <div className="mt-8 border-t border-babel-lines/30 pt-6">
      <h3 className="text-babel-gold text-sm tracking-widest uppercase flex items-center gap-2 mb-4">
        <PenLine size={16} /> Traveler&apos;s Log
      </h3>

      <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 mb-4">
        {notes.length === 0 ? (
          <p className="text-xs text-babel-dust italic">No travelers have left a mark here yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note._id || note.timestamp} className="bg-black/30 p-3 rounded border border-babel-lines/10">
              <p className="text-xs text-babel-gold mb-1">{note.author}</p>
              <p className="text-sm text-babel-parchment/80">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {signedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Leave a mark..."
            className="flex-1 bg-black/50 border border-babel-lines/30 p-2 text-sm text-babel-parchment focus:border-babel-gold focus:outline-none placeholder:text-babel-dust/50"
            maxLength={140}
          />
          <button
            type="submit"
            disabled={!newNote.trim() || saving}
            className="bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold/50 p-2 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <button
          onClick={() => signIn('google', { callbackUrl: window.location.pathname })}
          className="w-full flex items-center justify-center gap-2 bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold/50 p-3 rounded transition-colors text-xs tracking-widest uppercase"
        >
          <LogIn size={14} /> Sign in to leave a mark
        </button>
      )}
    </div>
  );
}
