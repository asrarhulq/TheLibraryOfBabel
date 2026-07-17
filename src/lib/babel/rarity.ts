import { isEnglishWord } from './dictionary';

export type RarityKind = 'long-word' | 'word-chain' | 'palindrome' | 'your-name';

export interface Rarity {
  kind: RarityKind;
  text: string;
  start: number;
  end: number;
  /** 1-5, higher = rarer. Used for scoring in the Journal. */
  weight: number;
  label: string;
}

// "Rare & prestigious" tuning, calibrated against the actual noise distribution
// of a 29-char alphabet (measured over 500 generated pages):
//   5-letter real words ≈ 1 in 83 pages, 6-letter ≈ 1 in 250, 7+ ≈ never by chance.
// So a 5-letter floor makes rarities genuinely seldom (you can browse many pages
// without one) yet attainable — each hit feels earned, not constant.
const MIN_LONG_WORD = 5; // 5+ letter real words are the everyday treasure
const PRESTIGE_WORD = 7; // 7+ letters is legendary (essentially never random)
const MIN_CHAIN_WORDS = 3; // three real words in a row — astronomically rare bonus
const MIN_CHAIN_WORD_LEN = 4;
const MIN_PALINDROME = 4;

function isPalindrome(s: string): boolean {
  if (s.length < MIN_PALINDROME) return false;
  for (let i = 0, j = s.length - 1; i < j; i++, j--) {
    if (s[i] !== s[j]) return false;
  }
  return true;
}

/**
 * Scan a page of Babel noise for genuinely notable occurrences.
 * Pure + deterministic: same text (+ name) always yields the same rarities,
 * so a page's "treasures" are a permanent property of its coordinate.
 */
export function detectRarities(text: string, travelerName?: string): Rarity[] {
  const found: Rarity[] = [];
  const claimed = (start: number, end: number) =>
    found.some((r) => start < r.end && end > r.start);

  // 1. The traveler's own name embedded in the void (only if named + real-ish).
  const name = (travelerName || '').trim().toLowerCase();
  if (name.length >= 3 && /^[a-z]+$/.test(name)) {
    let idx = text.indexOf(name);
    while (idx !== -1) {
      // must be a standalone token, not part of a longer letter run
      const before = idx > 0 ? text[idx - 1] : ' ';
      const after = idx + name.length < text.length ? text[idx + name.length] : ' ';
      if (!/[a-z]/.test(before) && !/[a-z]/.test(after) && !claimed(idx, idx + name.length)) {
        found.push({
          kind: 'your-name',
          text: text.slice(idx, idx + name.length),
          start: idx,
          end: idx + name.length,
          weight: 5,
          label: 'Your name, waiting in the void',
        });
      }
      idx = text.indexOf(name, idx + 1);
    }
  }

  // Tokenize into maximal lowercase-letter runs with their positions.
  const tokens: { word: string; start: number; end: number }[] = [];
  const re = /[a-z]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }

  // 2. Word chains: MIN_CHAIN_WORDS consecutive real words (each >= MIN_CHAIN_WORD_LEN),
  // separated only by single non-letter chars (space/comma/period/newline).
  for (let i = 0; i < tokens.length; i++) {
    let j = i;
    const chainWords: typeof tokens = [];
    while (
      j < tokens.length &&
      tokens[j].word.length >= MIN_CHAIN_WORD_LEN &&
      isEnglishWord(tokens[j].word)
    ) {
      // adjacency: gap between this token and previous must be exactly 1 separator char
      if (chainWords.length > 0) {
        const gap = tokens[j].start - chainWords[chainWords.length - 1].end;
        if (gap !== 1) break;
      }
      chainWords.push(tokens[j]);
      j++;
    }
    if (chainWords.length >= MIN_CHAIN_WORDS) {
      const start = chainWords[0].start;
      const end = chainWords[chainWords.length - 1].end;
      if (!claimed(start, end)) {
        found.push({
          kind: 'word-chain',
          text: text.slice(start, end),
          start,
          end,
          weight: 4 + Math.min(1, chainWords.length - MIN_CHAIN_WORDS),
          label: `${chainWords.length} real words in a row`,
        });
      }
      i = j - 1; // skip past the chain
    }
  }

  // 3. Long words (7+) and palindromes among single tokens.
  for (const t of tokens) {
    if (claimed(t.start, t.end)) continue;
    if (isPalindrome(t.word) && isEnglishWord(t.word)) {
      found.push({
        kind: 'palindrome',
        text: t.word,
        start: t.start,
        end: t.end,
        weight: 4,
        label: 'A palindrome — the same coming and going',
      });
    } else if (t.word.length >= MIN_LONG_WORD && isEnglishWord(t.word)) {
      const legendary = t.word.length >= PRESTIGE_WORD;
      found.push({
        kind: 'long-word',
        text: t.word,
        start: t.start,
        end: t.end,
        weight: Math.min(5, 2 + (t.word.length - MIN_LONG_WORD)),
        label: legendary
          ? `A ${t.word.length}-letter word — legendary in the noise`
          : `A ${t.word.length}-letter word surfaces from the void`,
      });
    }
  }

  return found.sort((a, b) => b.weight - a.weight || a.start - b.start);
}
