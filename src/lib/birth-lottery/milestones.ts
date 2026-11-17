import type { Milestone } from "./types";

// Widely documented world-history dates, shown when they fall inside a rolled lifespan.
// Negative years are BCE.
export const MILESTONES: Milestone[] = [
  { year: -3200, label: "Writing appears in Mesopotamia (c. 3200 BCE)" },
  { year: -2560, label: "Great Pyramid of Giza completed (c. 2560 BCE)" },
  { year: 165, label: "Antonine Plague sweeps the Roman Empire" },
  { year: 541, label: "Plague of Justinian begins" },
  { year: 1347, label: "The Black Death reaches Europe" },
  { year: 1440, label: "Gutenberg's printing press (c. 1440)" },
  { year: 1492, label: "Columbus reaches the Americas" },
  { year: 1796, label: "Jenner's smallpox vaccine" },
  { year: 1854, label: "John Snow links cholera to dirty water" },
  { year: 1918, label: "Influenza pandemic" },
  { year: 1928, label: "Fleming discovers penicillin" },
  { year: 1969, label: "First humans walk on the Moon" },
  { year: 1980, label: "Smallpox declared eradicated" },
  { year: 2020, label: "COVID-19 pandemic" },
];

export function milestonesWithin(from: number, to: number): Milestone[] {
  return MILESTONES.filter((m) => m.year >= from && m.year <= to);
}
