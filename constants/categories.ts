import type { ContentCategory } from '../types/content';
import type { IoniconName } from '../types/icon';
import { COLORS } from './colors';

export interface Category {
  id: ContentCategory | 'all';
  label: string;
  icon: IoniconName;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: '전체', icon: 'map-outline', color: COLORS.gray400 },
  { id: 'food', label: '음식', icon: 'restaurant-outline', color: '#FF8F00' },
  { id: 'festival', label: '축제', icon: 'sparkles-outline', color: '#E91E63' },
  { id: 'attraction', label: '관광명소', icon: 'compass-outline', color: '#42A5F5' },
  { id: 'culture', label: '문화', icon: 'library-outline', color: '#795548' },
  { id: 'nature', label: '자연', icon: 'leaf-outline', color: '#4CAF50' },
  { id: 'experience', label: '체험', icon: 'color-palette-outline', color: '#5C6BC0' },
];
