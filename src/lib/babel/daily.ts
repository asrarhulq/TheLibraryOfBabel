// The Daily Chamber — a single room that is the same for every traveler on a given
// UTC day, derived deterministically from the date. No storage needed; the date IS the seed.
import seedrandom from 'seedrandom';

export function dailyDateString(now: number): string {
  return new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

export interface DailyChamber {
  day: string;
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
  path: string;
}

export function getDailyChamber(now: number): DailyChamber {
  const day = dailyDateString(now);
  const rng = seedrandom('daily-chamber::' + day);

  // Build a plausible-looking hex room address from the date seed.
  const hex = (len: number) =>
    Array.from({ length: len }, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('');
  const roomId = `${hex(3)}-${hex(3)}-${hex(3)}`;

  const wall = Math.floor(rng() * 4) + 1;
  const shelf = Math.floor(rng() * 32) + 1;
  const book = Math.floor(rng() * 32) + 1;
  const page = Math.floor(rng() * 410) + 1;

  return {
    day,
    roomId,
    wall,
    shelf,
    book,
    page,
    path: `/room/${roomId}/${wall}/${shelf}/${book}/${page}?daily=1`,
  };
}
