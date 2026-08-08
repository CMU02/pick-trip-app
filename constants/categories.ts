import type { ContentCategory } from '../types/content';
import { COLORS } from './colors';

export interface Category {
  id: ContentCategory | 'all';
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: '전체', emoji: '🗺️', color: COLORS.gray400 },
  { id: 'food', label: '음식', emoji: '🍜', color: '#FF8F00' },
  { id: 'festival', label: '축제', emoji: '🎉', color: '#E91E63' },
  { id: 'attraction', label: '관광명소', emoji: '🏞️', color: '#42A5F5' },
  { id: 'culture', label: '문화', emoji: '🏛️', color: '#795548' },
  { id: 'nature', label: '자연', emoji: '🌿', color: '#4CAF50' },
  { id: 'experience', label: '체험', emoji: '🎨', color: '#5C6BC0' },
];
