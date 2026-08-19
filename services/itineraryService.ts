import type { CompanionType, StylePreference } from '../types/companion';
import type { ItineraryStop } from '../types/itinerary';
import type { Priority } from '../types/priority';
import { apiDurationToNights, nightsToApiDuration } from '../utils/tripDate';
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
  duration: number | null; // 백엔드 값(일수, 1=당일치기). toPlan()에서 박 수로 변환한다.
  days: ApiDay[];
}

export interface ItineraryPlan {
  itineraryId: string | null;
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null; // 박 수(0=당일치기) — 앱 내부 공용 표현
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
    duration: apiDurationToNights(data.duration),
    stops: daysToStops(data.days),
  };
}

interface SavePlanInput {
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null; // 박 수(0=당일치기)
  stops: ItineraryStop[];
  titleByContentId: Record<string, string>;
}

function toSaveBody(input: SavePlanInput) {
  return {
    title: input.title,
    region: input.region.toUpperCase(),
    travelDate: input.travelDate,
    duration: nightsToApiDuration(input.duration),
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

// 로그인 사용자의 저장된 일정을 전체 목록으로 주는 API는 없다(단건 조회만 존재, 웹팀 확인 완료).
// "내 여행" 목록 화면은 그래서 아직 못 만들고, 대신 마지막으로 저장한 일정 1건을
// services/lastItineraryStorage.ts에 남겨뒀다가 이 함수로 다시 불러와 보여준다.
export async function getItineraryPlan(itineraryId: string): Promise<ItineraryPlan> {
  const { data } = await apiClient.get<SavedResponse>(`/itineraries/${itineraryId}`);
  return toPlan(data);
}

interface GenerateItineraryInput {
  region: string;
  travelDate: string | null;
  duration: number | null; // 박 수(0=당일치기)
  companion: CompanionType | null;
  stylePrefs: StylePreference[];
  items: { contentId: string; priority: Priority }[];
}

function toGenerateBody(input: GenerateItineraryInput) {
  return {
    region: input.region.toUpperCase(),
    travelDate: input.travelDate,
    duration: nightsToApiDuration(input.duration),
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
// 백엔드가 장소마다 TourAPI 상세 정보를 순차 호출해 생성이 1~2분 걸릴 수 있으므로,
// apiClient의 기본 10초 타임아웃과 별도로 이 호출만 넉넉하게 잡는다.
const GENERATE_TIMEOUT_MS = 120_000;

export async function generateItineraryPlan(input: GenerateItineraryInput): Promise<ItineraryPlan> {
  const { data } = await apiClient.post<SavedResponse>(
    '/itineraries/generate',
    toGenerateBody(input),
    { timeout: GENERATE_TIMEOUT_MS },
  );
  return toPlan(data);
}
