export type ContentCategory =
  | 'food'
  | 'festival'
  | 'nature'
  | 'culture'
  | 'experience'
  | 'market'
  | 'indoor';

export interface Content {
  id: string;
  regionId: string;
  name: string;
  category: ContentCategory;
  tagline: string;
  duration: string;
  parking: boolean;
  kidsRecommended: boolean;
  seniorsRecommended: boolean;
  indoor: boolean;
  color: string;
}
