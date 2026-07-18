'use client';

// Traveler identity.
//  • Signed out → an anonymous random id kept in localStorage.
//  • Signed in with Google → a stable account id ("google:<sub>") so progress follows
//    the person across devices, with their Google name and photo.

const ID_KEY = 'babel_traveler_id'; // anonymous device id
const NAME_KEY = 'babel_traveler_name'; // manually-set name (anonymous mode)
const MERGED_KEY = 'babel_merged_into'; // marks that we already merged anon→account

interface SessionUser {
  id?: string;
  sub?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// The signed-in user is cached in-module after the first session fetch so the many
// getTravelerId() callers stay synchronous.
let cachedUser: SessionUser | null = null;
let sessionLoaded = false;

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'trav_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// A stable id for a signed-in Google user.
function accountId(u: SessionUser): string {
  const key = u.id || u.sub || u.email || '';
  return 'google:' + key;
}

export function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getTravelerId(): string {
  if (typeof window === 'undefined') return '';
  if (cachedUser) return accountId(cachedUser);
  return getAnonId();
}

export function isSignedIn(): boolean {
  return Boolean(cachedUser);
}

export function getLocalName(): string {
  if (typeof window === 'undefined') return '';
  if (cachedUser?.name) return cachedUser.name; // Google name wins when signed in
  return localStorage.getItem(NAME_KEY) || '';
}

export function setLocalName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NAME_KEY, name);
}

/**
 * Load the session once and, on first sign-in, merge any anonymous progress into the
 * account. Call this early (e.g. from a top-level effect). Safe to call repeatedly.
 */
export async function initSession(): Promise<SessionUser | null> {
  if (sessionLoaded) return cachedUser;
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    cachedUser = data?.user ?? null;
  } catch {
    cachedUser = null;
  }
  sessionLoaded = true;

  // First time signed in on this device → merge anon data into the account.
  if (cachedUser && typeof window !== 'undefined') {
    const acct = accountId(cachedUser);
    const anon = localStorage.getItem(ID_KEY);
    const alreadyMerged = localStorage.getItem(MERGED_KEY);
    if (anon && anon !== acct && alreadyMerged !== acct) {
      try {
        await fetch('/api/traveler/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-traveler-id': acct },
          credentials: 'same-origin',
          body: JSON.stringify({ fromId: anon, name: cachedUser.name || '' }),
        });
        localStorage.setItem(MERGED_KEY, acct);
      } catch {
        /* non-fatal */
      }
    }
  }
  return cachedUser;
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
  myClaims: () => api<{ claims: unknown[] }>('/api/claims/my'),
  badges: () =>
    api<{ collections: { kind: string; count: number; latest: number }[]; wordBadges: string[] }>(
      '/api/badges'
    ),
};
