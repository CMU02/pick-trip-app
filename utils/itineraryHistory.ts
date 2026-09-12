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

export interface TripBadge {
  label: string;
  // upcoming: 여행일이 오늘이거나 미래라 코랄(강조) 톤. past: 이미 지난 여행이라 회색 톤.
  tone: 'upcoming' | 'past';
}

// 홈 "저장한 여행" 카드 위에 얹는 D-day 뱃지. 여행일을 아직 안 정한 일정(travelDate가 없는
// 게스트용 임시 일정 등)은 뱃지 자체를 안 보여준다.
export function getTripBadge(travelDate: string | null): TripBadge | null {
  if (!travelDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = fromDateString(travelDate);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays > 0) return { label: `D-${diffDays}`, tone: 'upcoming' };
  if (diffDays === 0) return { label: 'D-DAY', tone: 'upcoming' };
  return { label: '지난 여행', tone: 'past' };
}
