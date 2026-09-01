import type { ContentCategory } from './content';

// 실제 도로 거리(카카오 모빌리티)인지 직선거리 폴백인지 — 백엔드
// NearbyContentResponse.DistanceBasis와 같은 이름·같은 의미.
export type NearbyDistanceBasis = 'ROAD' | 'STRAIGHT';

// GET /contents/{id}/nearby 응답 한 건. 목록/상세 콘텐츠(Content)와 달리 이 화면 전용
// 카드에 필요한 필드만 추린다 — 좌표·contentTypeId 등은 이 카드가 쓰지 않는다.
export interface NearbyContentItem {
  contentId: string;
  title: string;
  address: string;
  imageUrl: string | null;
  category: ContentCategory;
  // TourAPI 폴백(source: TOURAPI)이면 항상 null.
  summary: string | null;
  // TourAPI 폴백에서 대상 지역(하동·영주·예천) 밖이면 null.
  region: string | null;
  distanceKm: number;
  // distanceBasis가 STRAIGHT면 null.
  durationMinutes: number | null;
  distanceBasis: NearbyDistanceBasis;
}
