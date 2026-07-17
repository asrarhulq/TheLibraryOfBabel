import { NextRequest } from 'next/server';
import { saveDiscovery } from '@/lib/db/travelerData';
import { travelerIdFrom, parseCoord } from '../../_util';

export async function POST(request: NextRequest) {
  const travelerId = travelerIdFrom(request);
  if (!travelerId) return Response.json({ error: 'Missing traveler id' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const coord = parseCoord(body?.coord);
  if (!coord) return Response.json({ error: 'Bad coordinate' }, { status: 400 });

  const name = (typeof body?.name === 'string' ? body.name : 'Anonymous Traveler').slice(0, 40);
  const label = (typeof body?.label === 'string' ? body.label : '').slice(0, 120);
  const rawRarities = Array.isArray(body?.rarities) ? body.rarities : [];
  const rarities = rawRarities
    .filter((r: unknown) => r && typeof (r as { text?: unknown }).text === 'string')
    .slice(0, 20)
    .map((r: { kind?: string; text: string; weight?: number }) => ({
      kind: typeof r.kind === 'string' ? r.kind : 'long-word',
      text: r.text.slice(0, 100),
      weight: Math.max(1, Math.min(5, Number(r.weight) || 1)),
    }));

  const result = await saveDiscovery(travelerId, name, label, coord, rarities, Date.now());
  return Response.json(result);
}
