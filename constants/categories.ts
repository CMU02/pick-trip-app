import type { ContentCategory } from '../types/content';

export interface Category {
  id: ContentCategory | 'all';
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: '전체', emoji: '🗺️' },
  { id: 'food', label: '음식', emoji: '🍜' },
  { id: 'festival', label: '축제', emoji: '🎉' },
  { id: 'nature', label: '자연', emoji: '🌿' },
  { id: 'culture', label: '문화', emoji: '🏛️' },
  { id: 'experience', label: '체험', emoji: '🎨' },
  { id: 'market', label: '시장', emoji: '🛍️' },
  { id: 'indoor', label: '실내', emoji: '🏠' },
];
