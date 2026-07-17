import seedrandom from 'seedrandom';
import { stringToBigInt, ALPHABET } from './generator';

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
  // Sanitize query to only contain our 29 character alphabet
  const sanitized = query
    .toLowerCase()
    .split('')
    .filter((char) => ALPHABET.includes(char))
    .join('');

  if (sanitized.length === 0) {
    throw new Error('Query must contain valid characters.');
  }

  // Convert to BigInt, then to hex
  const num = stringToBigInt(sanitized);
  let hexString = num.toString(16);

  // If the hex string is very small, pad it out a bit to make the coordinates look believable
  while (hexString.length < 9) {
    // Generate a deterministically random prefix based on the query itself
    // so we don't change the underlying meaning, just shift the coordinate address
    // Wait, if we change the hex, we change the BigInt, which changes the decoded string!
    // We cannot pad it with random data without breaking the exact string decoding.
    // Instead, we just pad with '0' since 0 hex won't affect the BigInt value.
    hexString = '0' + hexString;
  }

  // Split hexString into 3 roughly equal chunks for X, Y, Z
  const third = Math.ceil(hexString.length / 3);
  const x = hexString.slice(0, third);
  const y = hexString.slice(third, 2 * third);
  const z = hexString.slice(2 * third);

  // Use the exact same deterministic target logic as the generator
  const targetRng = seedrandom(sanitized);
  const wall = Math.floor(targetRng() * 4) + 1;
  const shelf = Math.floor(targetRng() * 32) + 1;
  const book = Math.floor(targetRng() * 32) + 1;
  const page = Math.floor(targetRng() * 410) + 1;

  return { x, y, z, wall, shelf, book, page };
}
