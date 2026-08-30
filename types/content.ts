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
  // 아래 5개는 상세 조회(GET /contents/{id})에서만 내려온다. 목록 조회(GET /contents)
  // 응답엔 없어서, 카드 목록에서 만든 Content는 이 필드들이 전부 null이다.
  useTime: string | null;
  restDate: string | null;
  parking: string | null;
  stayDuration: string | null;
  reservationRequired: string | null;
}
