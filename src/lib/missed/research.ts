// Published figures used in the UI. Every number here was checked against the original papers
// (full text), not secondary summaries. Keep each figure next to its citation.

export const SC1999 = {
  cite: "Simons & Chabris (1999), Perception 28, 1059–1074",
  url: "https://doi.org/10.1068/p281059",
  /** 192 observers, all conditions: 54% noticed, 46% failed to notice. */
  observers: 192,
  missedPct: 46,
  /** Easy task (count passes) vs Hard task (count bounce and aerial passes separately), n = 96 each. */
  easyNoticedPct: 64,
  hardNoticedPct: 45,
};

export const MOST2001 = {
  cite: "Most, Simons, Scholl, Jimenez, Clifford & Chabris (2001), Psychological Science 12, 9–17",
  url: "https://doi.org/10.1111/1467-9280.00303",
  /** Exp. 1 (Table 1), observers attending WHITE shapes; n = 16 per condition. Unexpected cross colour → % noticed. */
  attendWhite: { white: 94, lightGray: 75, darkGray: 56, black: 6 },
  perCondition: 16,
  /** Exp. 3: a bright red cross, unique in colour, shape and motion, visible 5 s; 72% noticed (28% missed). */
  uniqueCrossNoticedPct: 72,
  uniqueCrossSeconds: 5,
};

export const LIMITS = [
  "This is a simplified web version, not a lab study. Your screen, device, lighting and how alert you are today all change the result.",
  "Knowing about the effect changes it: once you have seen this, you will look for surprises.",
  "Whether you noticed says nothing about your intelligence, eyesight or carefulness.",
];
