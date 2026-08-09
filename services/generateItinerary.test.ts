import { describe, expect, it } from 'vitest';
import { generateItinerary } from './generateItinerary';

describe('generateItinerary', () => {
  it('우선순위가 높은 순서로 배치한다', () => {
    const { stops } = generateItinerary({
      selectedIds: ['a', 'b', 'c'],
      priorities: { a: 'optional', b: 'must', c: 'good' },
    });

    expect(stops.map((stop) => stop.contentId)).toEqual(['b', 'c', 'a']);
  });

  // 안내문이 이전 우선순위로 남는 회귀(#43)를 막는다.
  it('안내문에 각 스탑의 우선순위를 그대로 쓴다', () => {
    const { stops } = generateItinerary({
      selectedIds: ['a', 'b'],
      priorities: { a: 'must', b: 'good' },
    });

    expect(stops[0].reason).toContain('꼭 가기로');
    expect(stops[1].reason).toContain('가면 좋음으로');
  });

  it('우선순위가 없는 항목은 가면 좋음으로 본다', () => {
    const { stops } = generateItinerary({ selectedIds: ['a'], priorities: {} });

    expect(stops[0].reason).toContain('가면 좋음으로');
  });
});
