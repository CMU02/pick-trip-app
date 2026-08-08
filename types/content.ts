export type ContentCategory =
  | 'food'
  | 'festival'
  | 'attraction'
  | 'culture'
  | 'nature'
  | 'experience';

export interface Content {
  id: string;
  regionId: string;
  name: string;
  category: ContentCategory;
  summary: string;
  address: string;
  imageUrl: string | null;
  indoor: boolean;
  latitude: number;
  longitude: number;
}
