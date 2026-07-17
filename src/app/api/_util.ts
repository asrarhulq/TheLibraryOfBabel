import { NextRequest } from 'next/server';
import { Coordinate } from '@/lib/babel/types';

export function travelerIdFrom(req: NextRequest): string | null {
  const id = req.headers.get('x-traveler-id');
  if (!id || id.length < 8 || id.length > 100) return null;
  return id;
}

export function parseCoord(raw: unknown): Coordinate | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const roomId = typeof c.roomId === 'string' ? c.roomId : null;
  const wall = Number(c.wall);
  const shelf = Number(c.shelf);
  const book = Number(c.book);
  const page = Number(c.page);
  if (!roomId || roomId.length > 100) return null;
  if ([wall, shelf, book, page].some((n) => !Number.isFinite(n))) return null;
  return { roomId, wall, shelf, book, page };
}
