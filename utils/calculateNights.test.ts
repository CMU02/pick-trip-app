import { calculateNights } from './calculateNights';

describe('calculateNights', () => {
  it('당일치기 여행은 0박을 반환한다', () => {
    const date = new Date('2026-06-13');
    expect(calculateNights(date, date)).toBe(0);
  });

  it('1박 2일 여행은 1을 반환한다', () => {
    const start = new Date('2026-06-13');
    const end = new Date('2026-06-14');
    expect(calculateNights(start, end)).toBe(1);
  });

  it('2박 3일 여행은 2를 반환한다', () => {
    const start = new Date('2026-06-13');
    const end = new Date('2026-06-15');
    expect(calculateNights(start, end)).toBe(2);
  });

  it('종료일이 시작일보다 빠르면 예외를 던진다', () => {
    const start = new Date('2026-06-15');
    const end = new Date('2026-06-13');
    expect(() => calculateNights(start, end)).toThrow('종료일은 시작일보다 빠를 수 없습니다.');
  });
});
