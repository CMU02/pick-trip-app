import { describe, expect, it, vi } from 'vitest';
import type { ItineraryStop } from '../types/itinerary';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const { toSaveBody } = await import('./itineraryService');

function stop(contentId: string, day: number): ItineraryStop {
  return {
    contentId,
    day,
    startTime: '10:00',
    endTime: '12:00',
    reason: '이유',
    addedByAi: false,
    addedForRest: false,
  };
}

const base = {
  title: '영주 여행',
  region: 'yeongju',
  travelDate: '2026-10-05',
  duration: 1,
  stops: [stop('a', 1), stop('b', 2)],
  titleByContentId: { a: '노계서원', b: '' },
};

describe('toSaveBody', () => {
  it('박 수를 서버 일수로 바꾼다', () => {
    expect(toSaveBody(base).duration).toBe(2);
  });

  // 서버는 duration을 필수로 받는다. 날짜를 안 고른 채 저장하면 박 수가 null이라
  // 예전엔 null을 보내 400(입력값을 확인해주세요)이 났다 — 일정의 일수로 채운다.
  it('박 수가 없으면 일정의 마지막 일차를 일수로 보낸다', () => {
    expect(toSaveBody({ ...base, travelDate: null, duration: null }).duration).toBe(2);
  });

  it('지역은 대문자 enum으로 보낸다', () => {
    expect(toSaveBody(base).region).toBe('YEONGJU');
  });

  it('이름을 모르는 장소는 빈 문자열 대신 title을 null로 보낸다', () => {
    const items = toSaveBody(base).days.flatMap((d) => d.items);
    expect(items.find((i) => i.contentId === 'b')?.title).toBeNull();
  });

  it('제목 앞뒤 공백을 지운다', () => {
    expect(toSaveBody({ ...base, title: '  영주 여행 ' }).title).toBe('영주 여행');
  });
});
