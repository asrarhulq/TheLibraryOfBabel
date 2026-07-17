import words from 'an-array-of-english-words';

// Create a Set for O(1) lookup. Only include words 4 letters or longer
// to avoid highlighting too much random noise from obscure 3-letter words.
const wordSet = new Set(words.filter(w => w.length >= 4));

export function isEnglishWord(word: string): boolean {
  return wordSet.has(word.toLowerCase());
}
