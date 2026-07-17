'use client';

import React, { useState, useEffect } from 'react';
import { PenLine, Send } from 'lucide-react';
import { travelerApi, getLocalName } from '@/lib/traveler/client';

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
  // Lazy initializer reads the saved name once on mount (client-only), avoiding a
  // setState-in-effect cascade.
  const [author, setAuthor] = useState(() => getLocalName() || 'Anonymous Traveler');
  const [saving, setSaving] = useState(false);

  const coord = { roomId, wall, shelf, book, page };

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
    if (!newNote.trim() || saving) return;
    setSaving(true);
    const res = await travelerApi.saveNote(coord, author, newNote.trim());
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your Name (Optional)"
          className="bg-black/50 border border-babel-lines/30 p-2 text-xs text-babel-parchment focus:border-babel-gold focus:outline-none placeholder:text-babel-dust/50"
          maxLength={30}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Leave a mark..."
            className="flex-1 bg-black/50 border border-babel-lines/30 p-2 text-sm text-babel-parchment focus:border-babel-gold focus:outline-none placeholder:text-babel-dust/50"
            required
            maxLength={140}
          />
          <button
            type="submit"
            disabled={!newNote.trim() || saving}
            className="bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold/50 p-2 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
