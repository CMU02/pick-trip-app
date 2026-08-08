import type { CompanionType, StylePreference } from './companion';
import type { Priority } from './priority';

export interface BasketItem {
  itemId: string;
  contentId: string;
  title: string | null;
  thumbnailUrl: string | null;
  priority: Priority;
}

export interface BasketConditions {
  region: string | null;
  travelDate: string | null;
  duration: number | null;
  companion: CompanionType | null;
  stylePrefs: StylePreference[];
}

export interface Basket {
  basketId: string | null;
  conditions: BasketConditions;
  items: BasketItem[];
}
