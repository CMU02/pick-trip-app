import { describe, expect, it } from 'vitest';
import { buildTimeOptions } from './timeOptions';

describe('buildTimeOptions', () => {
  it('양 끝을 포함해 간격대로 만든다', () => {
    expect(buildTimeOptions('05:00', '06:30', 30)).toEqual(['05:00', '05:30', '06:00', '06:30']);
  });

  it('일차 시작 시각 범위(05:00~18:00, 30분)는 27개', () => {
    const options = buildTimeOptions('05:00', '18:00', 30);
    expect(options).toHaveLength(27);
    expect(options[0]).toBe('05:00');
    expect(options.at(-1)).toBe('18:00');
  });
});
