export type Discipline =
  | 'PSY' // 心理学
  | 'ECO' // 经济学
  | 'POL' // 政治学
  | 'SOC' // 社会学
  | 'PHI' // 哲学
  | 'MPH' // 数学哲学
  | 'PPH' // 物理哲学
  | 'AIT'; // AI 技术

export interface Card {
  id: number;
  numeral: string;
  discipline: Discipline;
  glyph: string;
  titleZh: string;
  titleEn: string;
  essence: string;
  thinkPrompt: string;
  keywords: string[];
}

export const DISCIPLINE_META: Record<Discipline, { zh: string; en: string }> = {
  PSY: { zh: '心理学', en: 'PSYCHOLOGY' },
  ECO: { zh: '经济学', en: 'ECONOMICS' },
  POL: { zh: '政治学', en: 'POLITICS' },
  SOC: { zh: '社会学', en: 'SOCIOLOGY' },
  PHI: { zh: '哲学', en: 'PHILOSOPHY' },
  MPH: { zh: '数学哲学', en: 'PHILOSOPHY OF MATH' },
  PPH: { zh: '物理哲学', en: 'PHILOSOPHY OF PHYSICS' },
  AIT: { zh: 'AI 技术', en: 'AI & TECHNOLOGY' },
};
