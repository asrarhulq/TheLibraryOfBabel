import seedrandom from 'seedrandom';

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz, .';
export const CHARS_PER_LINE = 80;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_PAGE = CHARS_PER_LINE * LINES_PER_PAGE;

// Helper to convert string to base-29 BigInt using bijective numeration (digits 1-29) to preserve leading 'a's
export function stringToBigInt(str: string): bigint {
  let num = 0n;
  for (let i = 0; i < str.length; i++) {
    const charIndex = ALPHABET.indexOf(str[i].toLowerCase());
    if (charIndex === -1) continue;
    num = num * 29n + BigInt(charIndex + 1);
  }
  return num;
}

// Helper to convert base-29 BigInt to string using bijective numeration
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
  // Reconstruct the hidden string from X, Y, Z
  let hiddenString = '';
  try {
    const combinedHex = x + y + z;
    // Remove the pseudo-random formatting to get the pure hex
    const cleanHex = combinedHex.replace(/-/g, '');
    if (cleanHex.length > 0) {
      const num = BigInt('0x' + cleanHex);
      hiddenString = bigIntToString(num);
    }
  } catch (e) {
    // Ignore invalid hex
  }

  // Create a unique seed for this exact page
  const seed = `${x},${y},${z},${wall},${shelf},${book},${page}`;
  const rng = seedrandom(seed);

  let textArray = new Array(CHARS_PER_PAGE);
  for (let i = 0; i < CHARS_PER_PAGE; i++) {
    const charIndex = Math.floor(rng() * ALPHABET.length);
    textArray[i] = ALPHABET[charIndex];
  }

  // Inject hidden string if we are on the correct page
  if (hiddenString.length > 0 && hiddenString.length <= CHARS_PER_PAGE) {
    // Determine deterministic location based on the hidden string itself
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

  // Format into 40 lines of 80 characters
  let formattedText = '';
  for (let i = 0; i < LINES_PER_PAGE; i++) {
    formattedText += text.substring(i * CHARS_PER_LINE, (i + 1) * CHARS_PER_LINE) + '\n';
  }

  return formattedText.trimEnd();
}
