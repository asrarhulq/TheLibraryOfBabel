export interface TravelerNote {
  id: string;
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
  author: string;
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'babel_traveler_logs';

/**
 * Mock Database adapter for Traveler Logs.
 * Uses localStorage to persist notes locally.
 * Can be swapped out for Supabase or Vercel Postgres later.
 */
export function getNotesForPage(
  roomId: string,
  wall: number,
  shelf: number,
  book: number,
  page: number
): TravelerNote[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    const allNotes: TravelerNote[] = JSON.parse(data);
    return allNotes.filter(
      (n) => n.roomId === roomId && n.wall === wall && n.shelf === shelf && n.book === book && n.page === page
    );
  } catch (e) {
    return [];
  }
}

export function saveNote(note: Omit<TravelerNote, 'id' | 'timestamp'>): TravelerNote {
  if (typeof window === 'undefined') throw new Error('Cannot save note on server');

  const newNote: TravelerNote = {
    ...note,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };

  const data = localStorage.getItem(STORAGE_KEY);
  const allNotes: TravelerNote[] = data ? JSON.parse(data) : [];
  
  allNotes.push(newNote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));

  return newNote;
}

export function getRecentNotes(limit: number = 5): TravelerNote[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    const allNotes: TravelerNote[] = JSON.parse(data);
    return allNotes.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (e) {
    return [];
  }
}
