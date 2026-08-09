import type { InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const { wasAuthenticatedRequest } = await import('./apiClient');

function config(headers: Record<string, string>): InternalAxiosRequestConfig {
  return { headers } as unknown as InternalAxiosRequestConfig;
}

describe('wasAuthenticatedRequest', () => {
  it('Authorization 헤더를 달고 나간 요청이면 true를 반환한다', () => {
    // biome-ignore lint/style/useNamingConvention: HTTP 헤더 이름은 표준 표기를 따른다
    expect(wasAuthenticatedRequest(config({ Authorization: 'Bearer token' }))).toBe(true);
  });

  // 게스트는 토큰이 없어 헤더 없이 요청한다. 이 401은 만료가 아니므로
  // 토큰 정리·세션 만료 알림으로 이어지면 안 된다.
  it('Authorization 헤더가 없으면 false를 반환한다', () => {
    expect(wasAuthenticatedRequest(config({ 'Content-Type': 'application/json' }))).toBe(false);
  });

  it('config가 없으면 false를 반환한다', () => {
    expect(wasAuthenticatedRequest(undefined)).toBe(false);
  });
});
