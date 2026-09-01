import { useQueries } from '@tanstack/react-query';
import { getDayRoute } from '../services/routeDistanceService';
import type { Content } from '../types/content';
import type { ItineraryStop } from '../types/itinerary';
import type { DayRoute } from '../types/route';

/**
 * 일차별 구간 거리를 조회한다. 하루치를 한 번의 조회 단위로 묶는 이유는, 실도로 거리를
 * 연동하면(routeDistanceService 상단 TODO 참고) 카카오 길찾기 API가 "경유지 포함 하루
 * 경로 전체를 호출 1번"으로 처리하는 방식이라 이 경계와 맞춰둬야 나중에 갈아끼우기
 * 쉽기 때문이다.
 */
export function useItineraryRoutes(
  stops: ItineraryStop[],
  contentById: Record<string, Content | undefined>,
  totalDays: number,
) {
  const dayList = Array.from({ length: totalDays }, (_, i) => i + 1);
  const dayStopsList = dayList.map((day) => stops.filter((stop) => stop.day === day));

  const results = useQueries({
    queries: dayStopsList.map((dayStops, index) => ({
      queryKey: [
        'itinerary-day-route',
        dayList[index],
        dayStops.map((stop) => stop.contentId).join(','),
      ],
      queryFn: () => getDayRoute(dayStops, contentById),
      // dayStops.length > 1만 보면, 콘텐츠 상세정보(contentById)가 아직 하나도 안 채워진
      // 첫 렌더 시점에도 쿼리가 나가버린다. 그 순간엔 getDayRoute 안에서 좌표를 못 찾아
      // null이 반환되는데, 이 null이 queryKey(day+contentId 목록)에 고정 캐시돼서
      // 이후 contentById가 채워져도 재조회가 안 됐다(콘텐츠가 도착해도 queryKey가 그대로라
      // react-query가 "이미 답이 있다"고 판단). 그래서 항상 STRAIGHT 폴백만 보였다.
      // 이 날짜에 속한 모든 콘텐츠가 로드된 뒤에만 쿼리를 시작해 이 문제를 막는다.
      enabled: dayStops.length > 1 && dayStops.every((stop) => contentById[stop.contentId] != null),
    })),
  });

  const routeByDay: Record<number, DayRoute | null> = {};
  dayList.forEach((day, index) => {
    routeByDay[day] = results[index]?.data ?? null;
  });

  return {
    routeByDay,
    isLoading: results.some((result) => result.isLoading),
  };
}
