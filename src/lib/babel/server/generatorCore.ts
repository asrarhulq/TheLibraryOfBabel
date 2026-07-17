import 'server-only';
import seedrandom from 'seedrandom';
import { ALPHABET, CHARS_PER_LINE, LINES_PER_PAGE, CHARS_PER_PAGE } from '../alphabet';

// ─────────────────────────────────────────────────────────────────────────────
// SECRET GENERATION CORE — server-only.
// The `server-only` import above makes it a BUILD ERROR to import this file from
// any client component, so this algorithm is never included in the browser bundle.
// The browser only ever receives already-rendered page text via the room server
// component / API — never the code that produces it.
// ─────────────────────────────────────────────────────────────────────────────

// base-29 bijective numeration (digits 1-29) to preserve leading 'a's
export function stringToBigInt(str: string): bigint {
  let num = 0n;
  for (let i = 0; i < str.length; i++) {
    const charIndex = ALPHABET.indexOf(str[i].toLowerCase());
    if (charIndex === -1) continue;
    num = num * 29n + BigInt(charIndex + 1);
  }
  return num;
}

export function bigIntToString(num: bigint): string {
  let str = '';
  let temp = num;
  while (temp > 0n) {
    let remainder = Number(temp % 29n);
    if (remainder === 0) {
      remainder = 29;
      temp = temp / 29n - 1n;
    } else {
      temp = temp / 29n;
    }
    str = ALPHABET[remainder - 1] + str;
  }
  return str;
}

/** Decode the hidden phrase embedded in an X-Y-Z room address. */
export function decodeRoom(x: string, y: string, z: string): string {
  try {
    const combinedHex = (x + y + z).replace(/-/g, '');
    if (combinedHex.length === 0) return '';
    return bigIntToString(BigInt('0x' + combinedHex));
  } catch {
    return '';
  }
}

/**
 * Deterministically generates exactly one page of text based on coordinates.
 */
export function generatePageText(
  x: string,
  y: string,
  z: string,
  wall: number,
  shelf: number,
  book: number,
  page: number
): string {
  const hiddenString = decodeRoom(x, y, z);

  // Create a unique seed for this exact page
  const seed = `${x},${y},${z},${wall},${shelf},${book},${page}`;
  const rng = seedrandom(seed);

  const textArray = new Array(CHARS_PER_PAGE);
  for (let i = 0; i < CHARS_PER_PAGE; i++) {
    const charIndex = Math.floor(rng() * ALPHABET.length);
    textArray[i] = ALPHABET[charIndex];
  }

  // Inject hidden string if we are on the correct page
  if (hiddenString.length > 0 && hiddenString.length <= CHARS_PER_PAGE) {
    const targetRng = seedrandom(hiddenString);
    const wTarget = Math.floor(targetRng() * 4) + 1;
    const sTarget = Math.floor(targetRng() * 32) + 1;
    const bTarget = Math.floor(targetRng() * 32) + 1;
    const pTarget = Math.floor(targetRng() * 410) + 1;
    const offsetTarget = Math.floor(targetRng() * (CHARS_PER_PAGE - hiddenString.length));

    if (wall === wTarget && shelf === sTarget && book === bTarget && page === pTarget) {
      for (let i = 0; i < hiddenString.length; i++) {
        textArray[offsetTarget + i] = hiddenString[i];
      }
    }
  }

  const text = textArray.join('');

  let formattedText = '';
  for (let i = 0; i < LINES_PER_PAGE; i++) {
    formattedText += text.substring(i * CHARS_PER_LINE, (i + 1) * CHARS_PER_LINE) + '\n';
  }

  return formattedText.trimEnd();
}

/** Resolve a search phrase to its coordinate. Server-only so the encoding never ships. */
export interface Location {
  x: string;
  y: string;
  z: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

export function searchForText(query: string): Location {
  const sanitized = query
    .toLowerCase()
    .split('')
    .filter((char) => ALPHABET.includes(char))
    .join('');

  if (sanitized.length === 0) {
    throw new Error('Query must contain valid characters.');
  }

  const num = stringToBigInt(sanitized);
  let hexString = num.toString(16);
  while (hexString.length < 9) {
    hexString = '0' + hexString;
  }

  const third = Math.ceil(hexString.length / 3);
  const x = hexString.slice(0, third);
  const y = hexString.slice(third, 2 * third);
  const z = hexString.slice(2 * third);

  const targetRng = seedrandom(sanitized);
  const wall = Math.floor(targetRng() * 4) + 1;
  const shelf = Math.floor(targetRng() * 32) + 1;
  const book = Math.floor(targetRng() * 32) + 1;
  const page = Math.floor(targetRng() * 410) + 1;

  return { x, y, z, wall, shelf, book, page };
}
