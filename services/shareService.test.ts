import { describe, expect, it, vi } from 'vitest';

vi.mock('./apiClient', () => ({ apiClient: { post: vi.fn(), get: vi.fn() } }));

const { buildShareUrl } = await import('./shareService');

describe('buildShareUrl', () => {
  // picktrip:// 커스텀 스킴은 카카오톡 등에서 링크로 안 눌리고 미리보기도 안 나온다.
  // 웹 공유 페이지(pick-trip-client /share/[id])는 OG 카드와 일정 UI가 이미 있다.
  it('웹 공유 페이지 주소를 만든다', () => {
    expect(buildShareUrl('abc123')).toBe('https://www.pick-trip.app/share/abc123');
  });
});
