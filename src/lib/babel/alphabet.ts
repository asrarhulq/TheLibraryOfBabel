// Public, non-secret constants. The alphabet itself is described openly in the
// in-app Manual, so there is nothing to hide here — this file is safe to ship to
// the client. The valuable generation/encoding logic lives in ./server (never bundled).

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz, .';
export const CHARS_PER_LINE = 80;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_PAGE = CHARS_PER_LINE * LINES_PER_PAGE;
