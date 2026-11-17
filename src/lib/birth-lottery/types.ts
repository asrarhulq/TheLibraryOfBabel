// Shared (client-safe) types for The Birth Lottery.

export type Level = "region" | "continent" | "world" | "standin" | "model" | "fact";
export type Confidence = "high" | "medium" | "low";

export interface Field {
  /** Displayable value (percent or years), or null when there is no estimate. */
  value: number | null;
  level: Level | "none";
  /** Short provenance line shown under the stat. */
  note: string;
  /** Source id (see SOURCES in data.json). */
  src: string | null;
  /** Year of the underlying estimate, if different from the roll. */
  year: number | null;
  /** Spread across regions/countries when the value is a coarse fallback. */
  range?: [number, number];
  /** True when the value is context only (e.g. world average), not the region's own estimate. */
  contextOnly?: boolean;
}

export interface Milestone {
  year: number;
  label: string;
}

export interface SourceRef {
  id: string;
  name: string;
  by: string;
  url: string;
  license: string;
}

export interface RollResult {
  seed: string;
  mode: "random" | "year";
  dataVersion: number;
  year: number;
  yearLabel: string;
  bin: { start: number; end: number; label: string };
  region: { id: string; name: string; continent: string };
  country: { name: string; num: string; centroid: [number, number] };
  regionCountryNums: string[];
  worldPop: number;
  confidence: Confidence;
  stats: {
    survive1: Field;
    survive5: Field;
    survive15: Field;
    e0: Field;
    /** Expected age at death for someone who reached 15 (15 + remaining years). */
    e15: Field;
    literacy: Field;
    agriculture: Field;
    urban: Field;
  };
  /** Share still alive at each age 0…80 (fractions). */
  lx: number[];
  /** Age at death (completed years), or null = still alive at 80. */
  outcomeAge: number | null;
  /** Which of the 100 dots is "you". */
  youIndex: number;
  sentence: string;
  shareText: string;
  milestones: Milestone[];
  model: { standard: string; exact: boolean } | null;
  sources: SourceRef[];
}
