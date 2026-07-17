import { getDb } from './mongodb';
import { searchForText } from '../babel/server/generatorCore';
import { DeclarationDoc, DeclarationKind } from '../babel/types';

// Short, URL-safe, unguessable-ish id. Seeded from a passed timestamp + entropy string
// (no Date.now / Math.random constraints here — this runs in a normal Node route handler).
function makeId(now: number, salt: string): string {
  const base = (now.toString(36) + salt).replace(/[^a-z0-9]/gi, '');
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += base[(i * 7 + base.length) % base.length] || 'x';
  }
  return out.toLowerCase();
}

export interface CreateDeclarationInput {
  kind: DeclarationKind;
  phrase: string; // the phrase to locate (already assembled by the route)
  from?: string;
  to?: string;
  message: string;
  dateLabel?: string;
  isPublic: boolean;
}

export async function createDeclaration(
  input: CreateDeclarationInput,
  now: number
): Promise<DeclarationDoc> {
  const db = await getDb();
  const col = db.collection<DeclarationDoc>('declarations');

  const loc = searchForText(input.phrase);
  const coord = {
    roomId: `${loc.x}-${loc.y}-${loc.z}`,
    wall: loc.wall,
    shelf: loc.shelf,
    book: loc.book,
    page: loc.page,
  };

  // Ensure a unique id.
  let id = makeId(now, input.phrase);
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await col.findOne({ id }, { projection: { _id: 1 } });
    if (!clash) break;
    id = makeId(now + attempt + 1, input.phrase + attempt);
  }

  const doc: DeclarationDoc = {
    id,
    kind: input.kind,
    phrase: input.phrase.slice(0, 200),
    from: input.from?.slice(0, 60),
    to: input.to?.slice(0, 60),
    message: input.message.slice(0, 500),
    dateLabel: input.dateLabel?.slice(0, 40),
    coord,
    isPublic: Boolean(input.isPublic),
    timestamp: now,
  };

  await col.insertOne(doc as DeclarationDoc);
  return { ...doc, _id: undefined } as DeclarationDoc & { _id?: undefined };
}

export async function getDeclaration(id: string): Promise<DeclarationDoc | null> {
  if (!id || !/^[a-z0-9]{4,16}$/.test(id)) return null;
  const db = await getDb();
  const doc = await db
    .collection<DeclarationDoc>('declarations')
    .findOne({ id }, { projection: { _id: 0 } });
  return doc;
}

export async function getPublicDeclarations(limit = 30): Promise<DeclarationDoc[]> {
  const db = await getDb();
  return db
    .collection<DeclarationDoc>('declarations')
    .find({ isPublic: true }, { projection: { _id: 0 } })
    .sort({ timestamp: -1 })
    .limit(Math.min(60, limit))
    .toArray();
}
