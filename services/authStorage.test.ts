import { beforeEach, describe, expect, it, vi } from 'vitest';

const getItemAsync = vi.fn();

vi.mock('expo-secure-store', () => ({
  getItemAsync: (key: string) => getItemAsync(key),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const { hasStoredSession } = await import('./authStorage');

describe('hasStoredSession', () => {
  beforeEach(() => {
    getItemAsync.mockReset();
  });

  it('저장된 액세스 토큰이 있으면 true를 반환한다', async () => {
    getItemAsync.mockResolvedValue('stored-access-token');

    await expect(hasStoredSession()).resolves.toBe(true);
    expect(getItemAsync).toHaveBeenCalledWith('pick-trip.access-token');
  });

  it('토큰이 없으면 false를 반환한다', async () => {
    getItemAsync.mockResolvedValue(null);

    await expect(hasStoredSession()).resolves.toBe(false);
  });

  // 토큰 문자열을 그대로 흘리면 호출부에서 truthy 판정이 달라질 수 있으므로 boolean을 보장한다.
  it('토큰 문자열이 아니라 boolean을 반환한다', async () => {
    getItemAsync.mockResolvedValue('stored-access-token');

    expect(typeof (await hasStoredSession())).toBe('boolean');
  });

  it('SecureStore 읽기가 실패하면 false를 반환한다', async () => {
    getItemAsync.mockRejectedValue(new Error('keystore unavailable'));

    await expect(hasStoredSession()).resolves.toBe(false);
  });
});
