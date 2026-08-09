import { describe, expect, it } from 'vitest';
import { fromDateString, toDateString, toDurationType } from './tripDate';

describe('toDateString', () => {
  // 날짜 선택기는 로컬 자정 Date를 만든다. toISOString()을 쓰면 UTC+ 지역에서
  // 하루 앞으로 밀리므로, 로컬 필드에서 직접 만들어야 한다.
  it('로컬 자정 날짜를 그날 그대로 표기한다', () => {
    expect(toDateString(new Date(2026, 7, 9))).toBe('2026-08-09');
  });

  it('월과 일을 두 자리로 채운다', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('하루 중 어느 시각이든 같은 날짜를 만든다', () => {
    expect(toDateString(new Date(2026, 7, 9, 23, 59))).toBe('2026-08-09');
    expect(toDateString(new Date(2026, 7, 9, 0, 0))).toBe('2026-08-09');
  });
});

describe('fromDateString', () => {
  it('로컬 자정으로 되돌린다', () => {
    const date = fromDateString('2026-08-09');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(9);
    expect(date.getHours()).toBe(0);
  });

  it('toDateString과 왕복해도 같은 날짜다', () => {
    expect(toDateString(fromDateString('2026-01-01'))).toBe('2026-01-01');
  });
});

describe('toDurationType', () => {
  it('박 수에 맞는 기간 종류를 돌려준다', () => {
    expect(toDurationType(0)).toBe('day');
    expect(toDurationType(1)).toBe('1night');
    expect(toDurationType(2)).toBe('2night');
    expect(toDurationType(5)).toBe('custom');
  });
});
