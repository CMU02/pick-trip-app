import { REGIONS } from '../constants/regions';
import type { SavedItinerarySummary } from '../services/itineraryHistoryStorage';
import { fromDateString } from './tripDate';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

// 홈/마이페이지의 "저장한 여행" 카드에서 공통으로 쓰는 부제 텍스트("영주 · 8월 9일(일) · 1박 2일").
export function formatItinerarySub(summary: SavedItinerarySummary): string {
  const regionName = REGIONS.find((r) => r.id === summary.region)?.name;
  const parts = [regionName].filter((v): v is string => Boolean(v));
  if (summary.travelDate) {
    const date = fromDateString(summary.travelDate);
    const nights = summary.duration ?? 0;
    const durationLabel = nights > 0 ? `${nights}박 ${nights + 1}일` : '당일치기';
    parts.push(`${formatDate(date)} · ${durationLabel}`);
  }
  return parts.join(' · ');
}
