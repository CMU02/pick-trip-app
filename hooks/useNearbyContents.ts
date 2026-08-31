import { useQuery } from '@tanstack/react-query';
import { fetchNearbyContents } from '../services/contentService';

// 콘텐츠 상세 화면에서 "주변 콘텐츠" 추천 카드용. 기본 3곳만 보여준다 — 상세 화면 안의
// 보조 섹션이라 지도 화면급으로 많이 보여줄 필요가 없다.
export function useNearbyContents(contentId: string, size = 3) {
  return useQuery({
    queryKey: ['content-nearby', contentId, size],
    queryFn: () => fetchNearbyContents(contentId, { size }),
    enabled: Boolean(contentId),
  });
}
