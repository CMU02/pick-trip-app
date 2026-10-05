import { describe, expect, it } from 'vitest';
import { defaultStayMinutes, parseStayDurationMinutes } from './stayDuration';

describe('parseStayDurationMinutes', () => {
  it('"약 2시간"은 120분', () => {
    expect(parseStayDurationMinutes('약 2시간')).toBe(120);
  });

  // 범위는 짧은 쪽을 기본값으로 쓴다 — 사용자가 늘리는 건 쉽지만, 길게 잡으면 일정이 밀린다.
  it('"약 2~3시간"은 범위 앞쪽인 120분', () => {
    expect(parseStayDurationMinutes('약 2~3시간')).toBe(120);
  });

  it('"1시간 30분"은 90분', () => {
    expect(parseStayDurationMinutes('1시간 30분')).toBe(90);
  });

  it('"약 30분"은 30분', () => {
    expect(parseStayDurationMinutes('약 30분')).toBe(30);
  });

  it('"30분~1시간"은 앞쪽 단위를 따라 30분', () => {
    expect(parseStayDurationMinutes('30분~1시간')).toBe(30);
  });

  it('"1.5시간"은 90분', () => {
    expect(parseStayDurationMinutes('1.5시간')).toBe(90);
  });

  it('숫자가 없으면 null', () => {
    expect(parseStayDurationMinutes('반나절')).toBeNull();
  });

  it('null이면 null', () => {
    expect(parseStayDurationMinutes(null)).toBeNull();
  });
});

describe('defaultStayMinutes', () => {
  it('해석되면 그 값', () => {
    expect(defaultStayMinutes('약 2~3시간')).toBe(120);
  });

  it('해석 안 되면 60분', () => {
    expect(defaultStayMinutes('반나절')).toBe(60);
    expect(defaultStayMinutes(null)).toBe(60);
  });

  it('서버 범위(10~480분)로 자른다', () => {
    expect(defaultStayMinutes('5분')).toBe(10);
    expect(defaultStayMinutes('약 10시간')).toBe(480);
  });

  it('스테퍼 단위(10분)로 반올림한다', () => {
    expect(defaultStayMinutes('약 45분')).toBe(50);
  });
});
