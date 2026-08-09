import { describe, expect, it } from 'vitest';
import { withRo } from './josa';

describe('withRo', () => {
  it('받침이 없으면 로를 붙인다', () => {
    expect(withRo('꼭 가기')).toBe('꼭 가기로');
  });

  it('ㄹ 받침이면 로를 붙인다', () => {
    expect(withRo('서울')).toBe('서울로');
  });

  it('그 밖의 받침이면 으로를 붙인다', () => {
    expect(withRo('가면 좋음')).toBe('가면 좋음으로');
  });

  // 한글이 아닌 글자로 끝나면 받침을 알 수 없다. 어색해도 깨지지는 않아야 한다.
  it('한글이 아닌 글자로 끝나면 로를 붙인다', () => {
    expect(withRo('AI')).toBe('AI로');
    expect(withRo('')).toBe('로');
  });
});
