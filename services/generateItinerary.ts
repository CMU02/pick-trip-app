import type { Itinerary, ItineraryStop } from '../types/itinerary';
import { PRIORITY_LABELS, type Priority } from '../types/priority';

interface GenerateItineraryInput {
  selectedIds: string[];
  priorities: Record<string, Priority>;
}

const PRIORITY_WEIGHT: Record<Priority, number> = { must: 0, good: 1, optional: 2 };

// 로그인 없이도 일정을 만들 수 있도록, 서버 AI 호출 없이 프론트에서 우선순위 기반으로
// 담은 콘텐츠를 정렬·배치하는 간단한 규칙 기반 생성기. 저장/공유/수정 시점에만 로그인이 필요하다.
export function generateItinerary({ selectedIds, priorities }: GenerateItineraryInput): Itinerary {
  const ordered = [...selectedIds].sort(
    (a, b) => PRIORITY_WEIGHT[priorities[a] ?? 'good'] - PRIORITY_WEIGHT[priorities[b] ?? 'good'],
  );

  const midpoint = Math.ceil(ordered.length / 2);
  const stops: ItineraryStop[] = ordered.map((contentId, index) => {
    const day = index < midpoint ? 1 : 2;
    const slotIndex = index < midpoint ? index : index - midpoint;
    const startHour = 10 + slotIndex * 2;
    const priority = priorities[contentId] ?? 'good';

    return {
      contentId,
      day,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(startHour + 2).padStart(2, '0')}:00`,
      reason: `${PRIORITY_LABELS[priority]}로 표시하셔서 ${day}일차에 배치했습니다.`,
    };
  });

  return { totalDays: 2, stops };
}
