import { describe, expect, it } from 'vitest';
import { toErrorMessage } from './apiError';

describe('toErrorMessage', () => {
  it('서버 응답 본문의 message를 그대로 쓴다', () => {
    const error = {
      code: 'ITINERARY_NOT_FOUND',
      message: '일정을 찾을 수 없습니다.',
      traceId: 'x',
    };

    expect(toErrorMessage(error, '기본 문구')).toBe('일정을 찾을 수 없습니다.');
  });

  // Error 인스턴스의 message는 스택 추적용 내부 문구라 사용자에게 보여줄 것이 아니지만,
  // 형태가 같아 구분할 수 없다. 최소한 형태가 다른 값에서는 기본 문구로 물러나야 한다.
  it('message가 없으면 기본 문구를 쓴다', () => {
    expect(toErrorMessage({ code: 'X' }, '기본 문구')).toBe('기본 문구');
    expect(toErrorMessage({ message: '' }, '기본 문구')).toBe('기본 문구');
  });

  it('객체가 아니면 기본 문구를 쓴다', () => {
    expect(toErrorMessage(undefined, '기본 문구')).toBe('기본 문구');
    expect(toErrorMessage('문자열', '기본 문구')).toBe('기본 문구');
  });
});
