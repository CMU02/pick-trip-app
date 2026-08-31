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
      enabled: dayStops.length > 1,
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
