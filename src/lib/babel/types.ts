// Shared domain types for the traveler progression system.

export interface Coordinate {
  roomId: string;
  wall: number;
  shelf: number;
  book: number;
  page: number;
}

export interface TravelerStats {
  travelerId: string;
  name: string;
  chambersVisited: number; // distinct rooms
  pagesRead: number; // distinct pages
  wordsUncovered: number; // running total of highlighted words seen
  rareFinds: number;
  phrasesSought: number;
  score: number; // gamified points
  visitStreak: number;
  longestStreak: number;
  lastVisitDay: string; // YYYY-MM-DD (UTC)
  dailyChamberDay: string | null; // last date they visited the Daily Chamber
  createdAt: number;
  achievements: string[]; // achievement ids unlocked
}

export interface DiscoveryDoc {
  travelerId: string;
  name: string;
  kind: 'phrase' | 'rarity';
  rarityKind?: string;
  text: string;
  weight?: number;
  coord: Coordinate;
  timestamp: number;
}

export interface NoteDoc {
  _id?: string;
  travelerId: string;
  coord: Coordinate;
  author: string;
  content: string;
  timestamp: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji glyph, keeps it dependency-free
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-step', title: 'First Step', description: 'Enter your first chamber.', icon: '🚪' },
  { id: 'first-word', title: 'First Word', description: 'Uncover a real word in the noise.', icon: '📖' },
  { id: 'first-rarity', title: 'Treasure Hunter', description: 'Surface your first rarity.', icon: '✦' },
  { id: 'seeker', title: 'The Seeker', description: 'Search for a phrase and find it.', icon: '🔍' },
  { id: 'palindrome', title: 'Mirror, Mirror', description: 'Find a palindrome in the void.', icon: '🪞' },
  { id: 'long-word', title: 'Wordsmith', description: 'Find a 6-letter word or longer in the noise.', icon: '🗝️' },
  { id: 'chain', title: 'Against All Odds', description: 'Find three real words in a row.', icon: '⛓️' },
  { id: 'namesake', title: 'Namesake', description: 'Find your own name hidden in a page.', icon: '👤' },
  { id: 'all-walls', title: 'Full Circle', description: 'Visit all four walls of one chamber.', icon: '🧭' },
  { id: 'daily', title: 'Pilgrim', description: 'Visit the Daily Chamber.', icon: '🕯️' },
  { id: 'streak-7', title: 'Devoted', description: 'Maintain a 7-day visit streak.', icon: '🔥' },
  { id: 'explorer-25', title: 'Cartographer', description: 'Visit 25 distinct chambers.', icon: '🗺️' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
