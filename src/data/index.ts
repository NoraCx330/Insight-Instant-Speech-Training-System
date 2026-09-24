import { CARDS } from './cards1';
import { CARDS_PART2 } from './cards2';
import type { Card, Discipline } from './types';

export { DISCIPLINE_META } from './types';
export type { Card, Discipline };

export const ALL_CARDS: Card[] = [...CARDS, ...CARDS_PART2];

export function getCard(id: number): Card | undefined {
  return ALL_CARDS.find(c => c.id === id);
}
