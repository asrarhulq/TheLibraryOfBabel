import { getDb } from './mongodb';
import {
  TravelerStats,
  DiscoveryDoc,
  NoteDoc,
  Coordinate,
  ACHIEVEMENT_MAP,
} from '../babel/types';

// UTC day string, e.g. "2026-07-18". Passed timestamps only — no Date.now cleverness needed here.
function dayString(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

const DEFAULT_STATS = (travelerId: string, now: number): TravelerStats => ({
  travelerId,
  name: 'Anonymous Traveler',
  chambersVisited: 0,
  pagesRead: 0,
  wordsUncovered: 0,
  rareFinds: 0,
  phrasesSought: 0,
  score: 0,
  visitStreak: 0,
  longestStreak: 0,
  lastVisitDay: '',
  dailyChamberDay: null,
  createdAt: now,
  achievements: [],
});

export async function getOrCreateTraveler(
  travelerId: string,
  now: number
): Promise<TravelerStats> {
  const db = await getDb();
  const col = db.collection<TravelerStats>('travelers');
  const existing = await col.findOne({ travelerId });
  if (existing) return existing;
  const fresh = DEFAULT_STATS(travelerId, now);
  await col.insertOne(fresh);
  return fresh;
}

async function unlock(
  travelerId: string,
  ids: string[]
): Promise<string[]> {
  const valid = ids.filter((id) => ACHIEVEMENT_MAP[id]);
  if (valid.length === 0) return [];
  const db = await getDb();
  const col = db.collection<TravelerStats>('travelers');
  const before = await col.findOne({ travelerId }, { projection: { achievements: 1 } });
  const already = new Set(before?.achievements || []);
  const newly = valid.filter((id) => !already.has(id));
  if (newly.length === 0) return [];
  await col.updateOne(
    { travelerId },
    { $addToSet: { achievements: { $each: newly } }, $inc: { score: 50 * newly.length } }
  );
  return newly;
}

/**
 * Merge an anonymous traveler's data into an account on first sign-in.
 * Re-points discoveries/notes/visits to the account id and folds numeric stats together.
 * Idempotent-ish: safe if the anon id has no data.
 */
export async function mergeTraveler(
  accountId: string,
  fromId: string,
  name: string,
  now: number
): Promise<void> {
  if (!accountId || !fromId || accountId === fromId) return;
  const db = await getDb();

  // Re-point owned documents to the account.
  await db.collection('discoveries').updateMany({ travelerId: fromId }, { $set: { travelerId: accountId } });
  await db.collection('notes').updateMany({ travelerId: fromId }, { $set: { travelerId: accountId } });
  await db.collection('visits').updateMany(
    { key: { $regex: `^${escapeRegex(fromId)}::` } },
    [{ $set: { key: { $replaceOne: { input: '$key', find: `${fromId}::`, replacement: `${accountId}::` } } } }]
  ).catch(() => {});

  // Fold the anonymous stat totals into the account, then remove the anon profile.
  const col = db.collection<TravelerStats>('travelers');
  const account = await getOrCreateTraveler(accountId, now);
  const anon = await col.findOne({ travelerId: fromId });
  if (anon) {
    await col.updateOne(
      { travelerId: accountId },
      {
        $inc: {
          chambersVisited: anon.chambersVisited || 0,
          pagesRead: anon.pagesRead || 0,
          wordsUncovered: anon.wordsUncovered || 0,
          rareFinds: anon.rareFinds || 0,
          phrasesSought: anon.phrasesSought || 0,
          score: anon.score || 0,
        },
        $addToSet: { achievements: { $each: anon.achievements || [] } },
        $max: { longestStreak: anon.longestStreak || 0 },
      }
    );
    await col.deleteOne({ travelerId: fromId });
  }

  // Set the account's display name from Google (only if it still has the default).
  const clean = (name || '').trim().slice(0, 60);
  if (clean && (account.name === 'Anonymous Traveler' || !account.name)) {
    await col.updateOne({ travelerId: accountId }, { $set: { name: clean } });
  }
}

export async function setName(travelerId: string, name: string, now: number) {
  await getOrCreateTraveler(travelerId, now);
  const db = await getDb();
  const clean = name.trim().slice(0, 40) || 'Anonymous Traveler';
  await db
    .collection<TravelerStats>('travelers')
    .updateOne({ travelerId }, { $set: { name: clean } });
  return clean;
}

/**
 * Record a visit to a page. Handles distinct-chamber/page counting, daily streaks,
 * "all four walls" tracking, and daily-chamber achievement. Returns newly-unlocked ids.
 */
export async function recordVisit(
  travelerId: string,
  coord: Coordinate,
  now: number,
  opts: { isDailyChamber?: boolean } = {}
): Promise<{ newlyUnlocked: string[]; stats: TravelerStats }> {
  const db = await getDb();
  const col = db.collection<TravelerStats>('travelers');
  const visitsCol = db.collection('visits');
  await getOrCreateTraveler(travelerId, now);

  // Distinct page key + distinct room key via a unique visits collection.
  const roomKey = `${travelerId}::room::${coord.roomId}`;
  const pageKey = `${travelerId}::page::${coord.roomId}/${coord.wall}/${coord.shelf}/${coord.book}/${coord.page}`;
  const wallKey = `${travelerId}::wall::${coord.roomId}::${coord.wall}`;

  const newRoom = await firstTime(visitsCol, roomKey, now);
  const newPage = await firstTime(visitsCol, pageKey, now);
  await firstTime(visitsCol, wallKey, now);

  const inc: Record<string, number> = {};
  if (newRoom) inc.chambersVisited = 1;
  if (newPage) {
    inc.pagesRead = 1;
    inc.score = 5;
  }
  if (Object.keys(inc).length) {
    await col.updateOne({ travelerId }, { $inc: inc });
  }

  // Streak handling
  const today = dayString(now);
  const t = (await col.findOne({ travelerId }))!;
  if (t.lastVisitDay !== today) {
    const yesterday = dayString(now - 86400000);
    const newStreak = t.lastVisitDay === yesterday ? t.visitStreak + 1 : 1;
    await col.updateOne(
      { travelerId },
      {
        $set: {
          lastVisitDay: today,
          visitStreak: newStreak,
          longestStreak: Math.max(newStreak, t.longestStreak),
        },
      }
    );
  }

  if (opts.isDailyChamber && t.dailyChamberDay !== today) {
    await col.updateOne({ travelerId }, { $set: { dailyChamberDay: today } });
  }

  // Achievement checks
  const toUnlock: string[] = ['first-step'];
  const distinctWalls = await visitsCol.countDocuments({
    key: { $regex: `^${escapeRegex(travelerId)}::wall::${escapeRegex(coord.roomId)}::` },
  });
  if (distinctWalls >= 4) toUnlock.push('all-walls');

  const fresh = (await col.findOne({ travelerId }))!;
  if (fresh.chambersVisited >= 25) toUnlock.push('explorer-25');
  if (fresh.visitStreak >= 7) toUnlock.push('streak-7');
  if (opts.isDailyChamber) toUnlock.push('daily');

  const newlyUnlocked = await unlock(travelerId, toUnlock);
  const stats = (await col.findOne({ travelerId }))!;
  return { newlyUnlocked, stats };
}

// Insert-if-absent; returns true if this was the first time.
async function firstTime(
  visitsCol: import('mongodb').Collection,
  key: string,
  now: number
): Promise<boolean> {
  const res = await visitsCol.updateOne(
    { key },
    { $setOnInsert: { key, firstSeen: now } },
    { upsert: true }
  );
  return res.upsertedCount === 1;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Record uncovered words (from a page render). De-duped per (traveler,page) so
 * re-reading the same page doesn't keep inflating the count.
 */
export async function recordWords(
  travelerId: string,
  coord: Coordinate,
  wordCount: number,
  now: number
): Promise<string[]> {
  if (wordCount <= 0) return [];
  const db = await getDb();
  const visitsCol = db.collection('visits');
  const key = `${travelerId}::words::${coord.roomId}/${coord.wall}/${coord.shelf}/${coord.book}/${coord.page}`;
  const first = await firstTime(visitsCol, key, now);
  if (!first) return [];
  await db
    .collection<TravelerStats>('travelers')
    .updateOne(
      { travelerId },
      { $inc: { wordsUncovered: wordCount, score: wordCount } }
    );
  return unlock(travelerId, ['first-word']);
}

/**
 * Record a rarity discovery. De-duped per (traveler, coord, text).
 */
export async function recordRarity(
  travelerId: string,
  name: string,
  coord: Coordinate,
  rarity: { kind: string; text: string; weight: number },
  now: number
): Promise<{ isNew: boolean; newlyUnlocked: string[] }> {
  const db = await getDb();
  const disc = db.collection<DiscoveryDoc>('discoveries');
  const dupe = await disc.findOne({
    travelerId,
    kind: 'rarity',
    text: rarity.text,
    'coord.roomId': coord.roomId,
    'coord.wall': coord.wall,
    'coord.shelf': coord.shelf,
    'coord.book': coord.book,
    'coord.page': coord.page,
  });
  if (dupe) return { isNew: false, newlyUnlocked: [] };

  await disc.insertOne({
    travelerId,
    name,
    kind: 'rarity',
    rarityKind: rarity.kind,
    text: rarity.text,
    weight: rarity.weight,
    coord,
    timestamp: now,
  });
  await db
    .collection<TravelerStats>('travelers')
    .updateOne(
      { travelerId },
      { $inc: { rareFinds: 1, score: 25 * rarity.weight } }
    );

  const toUnlock = ['first-rarity'];
  if (rarity.kind === 'palindrome') toUnlock.push('palindrome');
  if (rarity.kind === 'your-name') toUnlock.push('namesake');
  if (rarity.kind === 'word-chain') toUnlock.push('chain');
  if (rarity.kind === 'long-word' && rarity.text.length >= 6) toUnlock.push('long-word');
  const newlyUnlocked = await unlock(travelerId, toUnlock);
  return { isNew: true, newlyUnlocked };
}

export async function recordPhrase(
  travelerId: string,
  name: string,
  phrase: string,
  coord: Coordinate,
  now: number
): Promise<string[]> {
  const db = await getDb();
  await getOrCreateTraveler(travelerId, now);
  await db.collection<DiscoveryDoc>('discoveries').insertOne({
    travelerId,
    name,
    kind: 'phrase',
    text: phrase.slice(0, 200),
    coord,
    timestamp: now,
  });
  await db
    .collection<TravelerStats>('travelers')
    .updateOne({ travelerId }, { $inc: { phrasesSought: 1, score: 20 } });
  return unlock(travelerId, ['seeker']);
}

// ---- Notes (Traveler's Log), migrated off localStorage ----

export async function getNotes(coord: Coordinate): Promise<NoteDoc[]> {
  const db = await getDb();
  const docs = await db
    .collection<NoteDoc>('notes')
    .find({
      'coord.roomId': coord.roomId,
      'coord.wall': coord.wall,
      'coord.shelf': coord.shelf,
      'coord.book': coord.book,
      'coord.page': coord.page,
    })
    .sort({ timestamp: 1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id?.toString() }));
}

export async function saveNote(
  travelerId: string,
  coord: Coordinate,
  author: string,
  content: string,
  now: number
): Promise<NoteDoc> {
  const db = await getDb();
  const note: NoteDoc = {
    travelerId,
    coord,
    author: author.trim().slice(0, 40) || 'Anonymous Traveler',
    content: content.trim().slice(0, 140),
    timestamp: now,
  };
  const res = await db.collection<NoteDoc>('notes').insertOne(note as NoteDoc);
  return { ...note, _id: res.insertedId.toString() };
}

// Personal discoveries: only the given traveler's own saved pages.
export async function getRecentDiscoveries(
  travelerId: string,
  limit = 20
): Promise<DiscoveryDoc[]> {
  if (!travelerId) return [];
  const db = await getDb();
  const docs = await db
    .collection<DiscoveryDoc>('discoveries')
    .find({ travelerId, kind: 'saved' })
    .sort({ timestamp: -1 })
    .limit(Math.min(50, limit))
    .toArray();
  return docs.map((d) => ({ ...d, _id: undefined } as DiscoveryDoc));
}

// Global: recent saved discoveries from ALL travelers (for the Great Hall).
export async function getRecentGlobalDiscoveries(
  limit = 6
): Promise<DiscoveryDoc[]> {
  const db = await getDb();
  const docs = await db
    .collection<DiscoveryDoc>('discoveries')
    .find({ kind: 'saved' })
    .sort({ timestamp: -1 })
    .limit(Math.min(30, limit))
    .toArray();
  return docs.map((d) => ({ ...d, _id: undefined } as DiscoveryDoc));
}

// Simple daily chamber info (the date string for today).
export function getDailyChamberInfo(): { today: string } {
  const d = new Date();
  return { today: d.toISOString().slice(0, 10) };
}

// Rarity collection stats: aggregate counts of rarity kinds found by a traveler.
export async function getRarityCollection(
  travelerId: string
): Promise<{ kind: string; count: number; latest: number }[]> {
  if (!travelerId) return [];
  const db = await getDb();
  const pipeline = [
    { $match: { travelerId, kind: 'rarity' } },
    { $group: { _id: '$rarityKind', count: { $sum: 1 }, latest: { $max: '$timestamp' } } },
    { $sort: { count: -1 } },
    { $project: { kind: '$_id', count: 1, latest: 1, _id: 0 } },
  ];
  return (await db
    .collection<DiscoveryDoc>('discoveries')
    .aggregate(pipeline)
    .toArray()) as { kind: string; count: number; latest: number }[];
}

// Word collection stats: alphabetical badge tracking.
export async function getWordBadgeCollection(
  travelerId: string
): Promise<string[]> {
  if (!travelerId) return [];
  const db = await getDb();
  const pipeline = [
    {
      $match: {
        travelerId,
        kind: 'rarity',
        rarityKind: { $in: ['long-word', 'palindrome'] },
      },
    },
    { $group: { _id: { $substrCP: ['$text', 0, 1] } } },
    { $project: { letter: '$_id', _id: 0 } },
  ];
  const rows = await db
    .collection<DiscoveryDoc>('discoveries')
    .aggregate(pipeline)
    .toArray();
  return (rows as { letter: string }[]).map((r) => r.letter);
}

/**
 * Explicitly save the current page to the traveler's own discoveries (opt-in via a button).
 * De-duped per (traveler, page). Records any rarities on the page as the discovery's detail.
 */
export async function saveDiscovery(
  travelerId: string,
  name: string,
  label: string,
  coord: Coordinate,
  rarities: { kind: string; text: string; weight: number }[],
  now: number
): Promise<{ isNew: boolean; newlyUnlocked: string[] }> {
  const db = await getDb();
  const disc = db.collection<DiscoveryDoc>('discoveries');

  const dupe = await disc.findOne({
    travelerId,
    kind: 'saved',
    'coord.roomId': coord.roomId,
    'coord.wall': coord.wall,
    'coord.shelf': coord.shelf,
    'coord.book': coord.book,
    'coord.page': coord.page,
  });
  if (dupe) return { isNew: false, newlyUnlocked: [] };

  const top = rarities[0];
  await disc.insertOne({
    travelerId,
    name,
    kind: 'saved',
    label,
    text: top?.text || label || 'a saved page',
    rarities: rarities.map((r) => ({ kind: r.kind, text: r.text, weight: r.weight })),
    coord,
    timestamp: now,
  });

  await db
    .collection<TravelerStats>('travelers')
    .updateOne(
      { travelerId },
      { $inc: { rareFinds: rarities.length > 0 ? 1 : 0, score: 15 } }
    );

  const toUnlock: string[] = [];
  for (const r of rarities) {
    if (r.kind === 'palindrome') toUnlock.push('palindrome');
    if (r.kind === 'your-name') toUnlock.push('namesake');
    if (r.kind === 'word-chain') toUnlock.push('chain');
    if (r.kind === 'long-word' && r.text.length >= 6) toUnlock.push('long-word');
    toUnlock.push('first-rarity');
  }
  const newlyUnlocked = await unlock(travelerId, toUnlock);
  return { isNew: true, newlyUnlocked };
}
