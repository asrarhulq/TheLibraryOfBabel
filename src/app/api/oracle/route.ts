import { NextRequest } from 'next/server';
import { searchForText } from '@/lib/babel/server/generatorCore';
import { ALPHABET } from '@/lib/babel/alphabet';

// ── Oracle responses ────────────────────────────────────────────────────────
// The Oracle gives a poetic, meaningful answer based on keywords in the question,
// then offers several "paths" (coordinates) that relate to different facets.

interface OraclePath {
  label: string; // e.g. "Love", "Wisdom", "The Self"
  phrase: string; // the phrase resolved to get this coordinate
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

interface OracleResponse {
  answer: string; // the meaningful poetic answer
  primaryPath: OraclePath; // the main coordinate
  paths: OraclePath[]; // multiple curated destinations
}

// Keyword → (answer, paths) mapping. Paths are resolved to coordinates
// server-side using the search engine.
const ORACLE_WISDOM: {
  keywords: string[];
  answer: string;
  paths: { label: string; phrase: string }[];
}[] = [
  {
    keywords: ['love', 'heart', 'feel', 'alone', 'lonely', 'relationship', 'friend', 'family', 'marry', 'marriage'],
    answer:
      'Love is the only word that appears in every book of this Library. When you ask about love, you are asking about the thread that binds every possible story together. The Library holds every love letter ever written and every one that will be — including the one meant for you. You are not searching for love; love has already found its coordinate. You need only walk to it.',
    paths: [
      { label: 'The Love That Waits', phrase: 'love finds you' },
      { label: 'Your Heart\'s Echo', phrase: 'my heart knows' },
      { label: 'A Bond Unbroken', phrase: 'together always' },
      { label: 'The Self You Must Love', phrase: 'i am enough' },
    ],
  },
  {
    keywords: ['meaning', 'purpose', 'why', 'life', 'exist', 'reason', 'point', 'death', 'die', 'mortal'],
    answer:
      'The Library is a mirror — it contains every answer because it contains every question. Your purpose is not hidden in some distant hexagon; it is written on the page in front of you, waiting to be read. The meaning of life, here in the infinite stacks, is simply this: to turn the page. Every new page is a new possibility. You are the reader and the author.',
    paths: [
      { label: 'The Purpose You Seek', phrase: 'the meaning of life' },
      { label: 'A Page Yet Unread', phrase: 'what comes next' },
      { label: 'The Reason You\'re Here', phrase: 'i am here now' },
      { label: 'Beyond the Last Page', phrase: 'and so it goes' },
    ],
  },
  {
    keywords: ['future', 'tomorrow', 'will', 'happen', 'predict', 'destiny', 'fate', 'path', 'ahead', 'next'],
    answer:
      'Every possible future is already shelved here. The volume describing your tomorrow sits side by side with the one describing a different choice. The Oracle does not predict — it reveals. What you call the future is simply a page you have not yet turned. Walk the stacks, and you will find that all futures are real, but only the one you choose becomes your own.',
    paths: [
      { label: 'The Tomorrow You Choose', phrase: 'tomorrow i will' },
      { label: 'A Destiny Unwritten', phrase: 'fate is a choice' },
      { label: 'The Path Ahead', phrase: 'the road forward' },
      { label: 'What Waits for You', phrase: 'something wonderful' },
    ],
  },
  {
    keywords: ['happy', 'sad', 'pain', 'suffer', 'joy', 'peace', 'hope', 'fear', 'afraid', 'anxiety', 'worry'],
    answer:
      'In a library where every possible sentence exists, sorrow and joy sit on the same shelf, often on the same page. The Library does not distinguish — it preserves both equally. Your pain is real, and somewhere in these stacks is the proof that it will pass. Somewhere else is the record of a joy you have not yet felt. Both are true. Keep walking.',
    paths: [
      { label: 'The Place Where Pain Fades', phrase: 'this too shall pass' },
      { label: 'Joy, Unclaimed', phrase: 'pure happiness' },
      { label: 'Peace in the Stacks', phrase: 'be still and know' },
      { label: 'Hope, Eternal', phrase: 'hope never dies' },
    ],
  },
  {
    keywords: ['know', 'truth', 'true', 'real', 'secret', 'mystery', 'understand', 'wisdom', 'learn', 'knowledge'],
    answer:
      'Every truth ever discovered and every truth yet to be found are neighbors in this Library. Knowledge, here, is not earned — it is located. But wisdom is different: wisdom is knowing which page to turn. The secret you seek is not in some forbidden tome but in the simple act of continuing to search. The Library gives no answers; it only offers every possible page. The understanding is yours to build.',
    paths: [
      { label: 'The Truth That Sets Free', phrase: 'the truth is' },
      { label: 'Ancient Wisdom', phrase: 'know thyself' },
      { label: 'A Secret Long Kept', phrase: 'the hidden answer' },
      { label: 'The Key to Understanding', phrase: 'to understand all' },
    ],
  },
  {
    keywords: ['who', 'am', 'self', 'identity', 'myself', 'myself', 'name', 'person', 'soul', 'spirit'],
    answer:
      'You are already written into the infinite. Every version of you — every choice, every word, every thought — exists on some page of the Library. The question "Who am I?" has as many answers as there are shelves. The Library\'s answer is not a single sentence but an invitation: walk the stacks and discover which of your infinite selves you choose to become.',
    paths: [
      { label: 'Your Name in the Void', phrase: 'i am' },
      { label: 'The Self You Might Be', phrase: 'who will i become' },
      { label: 'A Mirror in the Stacks', phrase: 'look within yourself' },
      { label: 'The Soul\'s Address', phrase: 'my soul remembers' },
    ],
  },
];

// Fallback oracle for questions that don't match any theme.
const FALLBACK_ORACLE = {
  answer:
    'The Library contains every possible answer, but some questions are rarer than others. Yours is a question that resonates through many hexagons. The coordinate you seek is real — it has always been here. Walk to it and see what the infinite has preserved for you.',
  paths: [
    { label: 'Where Your Question Lives', phrase: 'the answer is' },
    { label: 'A Related Truth', phrase: 'i sought and found' },
    { label: 'The Echo of Your Words', phrase: 'and so i asked' },
    { label: 'A Page of Significance', phrase: 'this matters' },
  ],
};

function buildOracleResponse(question: string): OracleResponse {
  const lower = question.toLowerCase();

  // Find the best-matching wisdom entry.
  let best = FALLBACK_ORACLE;
  let bestScore = 0;
  for (const entry of ORACLE_WISDOM) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Resolve all paths to coordinates.
  const resolvedPaths: OraclePath[] = best.paths.map((p) => {
    let loc;
    try {
      loc = searchForText(p.phrase);
    } catch {
      // If the phrase can't be resolved (shouldn't happen), use a safe fallback.
      loc = searchForText('the library');
    }
    return {
      label: p.label,
      phrase: p.phrase,
      roomId: `${loc.x}-${loc.y}-${loc.z}`,
      wall: loc.wall,
      shelf: loc.shelf,
      book: loc.book,
      page: loc.page,
    };
  });

  // The primary path is the first resolved path.
  const primaryPath = resolvedPaths[0];

  // Also include a path for the exact question the user typed.
  let exactPath: OraclePath;
  try {
    const sanitized = question
      .toLowerCase()
      .split('')
      .filter((char) => ALPHABET.includes(char))
      .join('');
    const loc = sanitized.length > 0 ? searchForText(sanitized) : searchForText('the library');
    exactPath = {
      label: 'Your Exact Question',
      phrase: sanitized || 'the library',
      roomId: `${loc.x}-${loc.y}-${loc.z}`,
      wall: loc.wall,
      shelf: loc.shelf,
      book: loc.book,
      page: loc.page,
    };
  } catch {
    exactPath = resolvedPaths[0];
  }

  // Deduplicate and ensure we have the exact path first, then the themed ones.
  const seen = new Set<string>();
  const allPaths: OraclePath[] = [];
  for (const p of [exactPath, ...resolvedPaths]) {
    const k = `${p.roomId}-${p.wall}-${p.shelf}-${p.book}-${p.page}`;
    if (!seen.has(k)) {
      seen.add(k);
      allPaths.push(p);
    }
  }

  return {
    answer: best.answer,
    primaryPath: allPaths[0],
    paths: allPaths.slice(0, 6),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return Response.json({ error: 'Ask something, traveler.' }, { status: 400 });
  }

  try {
    const oracle = buildOracleResponse(question);
    return Response.json(oracle);
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'The Library could not divine an answer.' },
      { status: 400 }
    );
  }
}