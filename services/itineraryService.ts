import type { CompanionType, StylePreference } from '../types/companion';
import type { ItineraryStop } from '../types/itinerary';
import type { Priority } from '../types/priority';
import { apiClient } from './apiClient';

interface ApiItem {
  contentId: string;
  title: string | null;
  order: number;
  reason: string;
}

interface ApiDay {
  dayIndex: number;
  items: ApiItem[];
}

interface SavedResponse {
  itineraryId: string;
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  days: ApiDay[];
}

export interface ItineraryPlan {
  itineraryId: string | null;
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  stops: ItineraryStop[];
}

function daysToStops(days: ApiDay[]): ItineraryStop[] {
  const stops: ItineraryStop[] = [];
  for (const day of days) {
    const sorted = [...day.items].sort((a, b) => a.order - b.order);
    sorted.forEach((item, index) => {
      const startHour = 10 + index * 2;
      stops.push({
        contentId: item.contentId,
        day: day.dayIndex,
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(startHour + 2).padStart(2, '0')}:00`,
        reason: item.reason,
      });
    });
  }
  return stops;
}

function stopsToDays(stops: ItineraryStop[], titleByContentId: Record<string, string>) {
  const dayIndexes = Array.from(new Set(stops.map((s) => s.day))).sort((a, b) => a - b);
  return dayIndexes.map((dayIndex) => ({
    dayIndex,
    items: stops
      .filter((s) => s.day === dayIndex)
      .map((s, order) => ({
        contentId: s.contentId,
        title: titleByContentId[s.contentId] ?? null,
        order,
        reason: s.reason,
        pinned: false,
      })),
  }));
}

function toPlan(data: SavedResponse): ItineraryPlan {
  return {
    itineraryId: data.itineraryId,
    title: data.title,
    region: data.region.toLowerCase(),
    travelDate: data.travelDate,
    duration: data.duration,
    stops: daysToStops(data.days),
  };
}

interface SavePlanInput {
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  stops: ItineraryStop[];
  titleByContentId: Record<string, string>;
}

function toSaveBody(input: SavePlanInput) {
  return {
    title: input.title,
    region: input.region.toUpperCase(),
    travelDate: input.travelDate,
    duration: input.duration,
    days: stopsToDays(input.stops, input.titleByContentId),
  };
}

export async function saveItineraryPlan(input: SavePlanInput): Promise<ItineraryPlan> {
  const { data } = await apiClient.post<SavedResponse>('/itineraries', toSaveBody(input));
  return toPlan(data);
}

export async function updateItineraryPlan(
  itineraryId: string,
  input: SavePlanInput,
): Promise<ItineraryPlan> {
  const { data } = await apiClient.patch<SavedResponse>(
    `/itineraries/${itineraryId}`,
    toSaveBody(input),
  );
  return toPlan(data);
}

interface GenerateItineraryInput {
  region: string;
  travelDate: string | null;
  duration: number | null;
  companion: CompanionType | null;
  stylePrefs: StylePreference[];
  items: { contentId: string; priority: Priority }[];
}

function toGenerateBody(input: GenerateItineraryInput) {
  return {
    region: input.region.toUpperCase(),
    travelDate: input.travelDate,
    duration: input.duration,
    companion: input.companion ? input.companion.toUpperCase() : null,
    stylePrefs: input.stylePrefs.map((pref) => pref.toUpperCase()),
    items: input.items.map((item) => ({
      contentId: item.contentId,
      priority: item.priority.toUpperCase(),
    })),
  };
}

// AI 일정 생성은 로그인한 사용자만 호출 가능하다(백엔드가 비로그인 요청을 401로 거부함).
// 게스트는 services/generateItinerary.ts의 프론트 규칙 기반 생성기를 대신 사용한다.
export async function generateItineraryPlan(input: GenerateItineraryInput): Promise<ItineraryPlan> {
  const { data } = await apiClient.post<SavedResponse>(
    '/itineraries/generate',
    toGenerateBody(input),
  );
  return toPlan(data);
}
