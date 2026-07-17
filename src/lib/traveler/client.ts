'use client';

// Anonymous traveler identity — a random id persisted in localStorage.
// No login, no personal data; it simply lets the server attribute progress.

const ID_KEY = 'babel_traveler_id';
const NAME_KEY = 'babel_traveler_name';

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'trav_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function getTravelerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getLocalName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NAME_KEY) || '';
}

export function setLocalName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NAME_KEY, name);
}

// All API calls carry the traveler id as a header.
async function api<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-traveler-id': getTravelerId(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const travelerApi = {
  visit: (coord: unknown, isDailyChamber = false) =>
    api<{ newlyUnlocked: string[]; stats: unknown }>('/api/visit', { coord, isDailyChamber }),
  words: (coord: unknown, wordCount: number) =>
    api<{ newlyUnlocked: string[] }>('/api/words', { coord, wordCount }),
  rarity: (coord: unknown, name: string, rarity: unknown) =>
    api<{ isNew: boolean; newlyUnlocked: string[] }>('/api/rarity', { coord, name, rarity }),
  phrase: (coord: unknown, name: string, phrase: string) =>
    api<{ newlyUnlocked: string[] }>('/api/phrase', { coord, name, phrase }),
  stats: () => api<{ stats: unknown }>('/api/traveler'),
  setName: (name: string) => api<{ name: string }>('/api/name', { name }),
  notes: (coord: unknown) => api<{ notes: unknown[] }>('/api/notes/get', { coord }),
  saveNote: (coord: unknown, author: string, content: string) =>
    api<{ note: unknown }>('/api/notes', { coord, author, content }),
  recent: () => api<{ discoveries: unknown[] }>('/api/discoveries'),
  // Explicitly save the current page to the traveler's OWN discoveries (opt-in).
  savePage: (coord: unknown, name: string, label: string, rarities: unknown[]) =>
    api<{ isNew: boolean; newlyUnlocked: string[] }>('/api/discoveries/save', {
      coord,
      name,
      label,
      rarities,
    }),
};
