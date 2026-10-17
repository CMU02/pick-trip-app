import { describe, expect, it, vi } from 'vitest';
import { completeLogin } from './loginTransition';

describe('completeLogin', () => {
  it('게스트 바구니 항목을 비우고 로그인 상태로 바꾼다', () => {
    const clearItems = vi.fn().mockResolvedValue(undefined);
    const setIsGuest = vi.fn();

    completeLogin({ clearItems, setIsGuest });

    expect(clearItems).toHaveBeenCalledTimes(1);
    expect(setIsGuest).toHaveBeenCalledWith(false);
  });

  // 바구니 저장소 오류 때문에 로그인 직후 화면 전환이 막히면 안 된다.
  it('바구니 비우기가 실패해도 로그인 상태로 바꾼다', async () => {
    const clearItems = vi.fn().mockRejectedValue(new Error('storage failure'));
    const setIsGuest = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    completeLogin({ clearItems, setIsGuest });
    await Promise.resolve();

    expect(setIsGuest).toHaveBeenCalledWith(false);
  });
});
