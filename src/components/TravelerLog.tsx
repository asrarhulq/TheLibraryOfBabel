'use client';

import React, { useState, useEffect } from 'react';
import { getNotesForPage, saveNote, TravelerNote } from '@/lib/db/travelerLog';
import { PenLine, Send } from 'lucide-react';

interface TravelerLogProps {
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

export default function TravelerLog({ roomId, wall, shelf, book, page }: TravelerLogProps) {
  const [notes, setNotes] = useState<TravelerNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [author, setAuthor] = useState('Anonymous Traveler');

  useEffect(() => {
    // Load notes when the page changes
    setNotes(getNotesForPage(roomId, wall, shelf, book, page));
  }, [roomId, wall, shelf, book, page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note = saveNote({
      roomId,
      wall,
      shelf,
      book,
      page,
      author: author.trim() || 'Anonymous Traveler',
      content: newNote.trim(),
    });

    setNotes([...notes, note]);
    setNewNote('');
  };

  return (
    <div className="mt-8 border-t border-babel-lines/30 pt-6">
      <h3 className="text-babel-gold text-sm tracking-widest uppercase flex items-center gap-2 mb-4">
        <PenLine size={16} /> Traveler's Log
      </h3>
      
      <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 mb-4">
        {notes.length === 0 ? (
          <p className="text-xs text-babel-dust italic">No travelers have left a mark here yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-black/30 p-3 rounded border border-babel-lines/10">
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
            disabled={!newNote.trim()}
            className="bg-babel-gold/10 hover:bg-babel-gold/20 text-babel-gold border border-babel-gold/50 p-2 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
