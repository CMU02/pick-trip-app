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

  // 게스트 미리보기는 실제 AI가 판단한 것처럼 보이면 안 되므로, 우선순위와 무관하게
  // 웹 버전과 동일한 "미리보기" 안내문을 그대로 쓴다.
  it('모든 스탑에 미리보기 안내문을 그대로 쓴다', () => {
    const { stops } = generateItinerary({
      selectedIds: ['a', 'b'],
      priorities: { a: 'must', b: 'good' },
    });

    expect(stops[0].reason).toBe('담아주신 콘텐츠를 기반으로 만든 미리보기 일정입니다.');
    expect(stops[1].reason).toBe('담아주신 콘텐츠를 기반으로 만든 미리보기 일정입니다.');
  });

  it('우선순위가 없는 항목도 배치에는 포함된다', () => {
    const { stops } = generateItinerary({ selectedIds: ['a'], priorities: {} });

    expect(stops).toHaveLength(1);
    expect(stops[0].contentId).toBe('a');
  });
});
