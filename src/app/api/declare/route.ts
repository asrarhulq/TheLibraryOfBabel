import { NextRequest } from 'next/server';
import { createDeclaration } from '@/lib/db/declarations';
import { DeclarationKind } from '@/lib/babel/types';
import { ALPHABET } from '@/lib/babel/alphabet';

const KINDS: DeclarationKind[] = ['love', 'future', 'anniversary', 'other'];

// Keep only characters the Library can address.
function sanitize(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .filter((c) => ALPHABET.includes(c))
    .join('')
    .trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'Bad request' }, { status: 400 });

  const kind: DeclarationKind = KINDS.includes(body.kind) ? body.kind : 'love';
  const from = typeof body.from === 'string' ? body.from.trim() : '';
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const dateLabel = typeof body.dateLabel === 'string' ? body.dateLabel.trim() : '';

  // Assemble the phrase that gets located in the Library, per kind.
  let phrase = '';
  if (kind === 'love') {
    if (!from || !to) return Response.json({ error: 'Both names are required.' }, { status: 400 });
    phrase = sanitize(`${from} loves ${to}`);
  } else if (kind === 'anniversary') {
    phrase = sanitize(dateLabel || from);
    if (!phrase) return Response.json({ error: 'A date or occasion is required.' }, { status: 400 });
  } else {
    // future self — locate by the message itself (or a name if given)
    phrase = sanitize(message || from);
    if (!phrase) return Response.json({ error: 'Write something to immortalize.' }, { status: 400 });
  }

  if (phrase.length === 0) {
    return Response.json({ error: 'Please use letters, spaces, commas or periods.' }, { status: 400 });
  }

  const doc = await createDeclaration(
    { kind, phrase, from, to, message, dateLabel, isPublic: Boolean(body.isPublic) },
    Date.now()
  );
  return Response.json({ declaration: doc });
}
