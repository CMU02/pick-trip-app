import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchContents } from './contentService';

// vi.mock은 import보다 먼저 끌어올려지므로 mock 함수도 vi.hoisted로 함께 끌어올린다.
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('./apiClient', () => ({ apiClient: { get } }));

function page(totalCount: number, size: number) {
  return { data: { totalCount, page: 0, size, items: [] } };
}

describe('fetchContents', () => {
  beforeEach(() => get.mockReset());

  it('지역 하나면 20개씩 요청한다', async () => {
    get.mockResolvedValue(page(100, 20));
    await fetchContents(['hadong'], 0);
    expect(get).toHaveBeenCalledWith('/contents', {
      params: { region: 'HADONG', page: 0, size: 20 },
    });
  });

  // 지역마다 20개씩 받으면 3개 지역 선택 시 한 번에 60개를 그린다 — 합계가 20개 남짓이 되게 나눈다.
  it('지역 3개면 지역당 7개씩 요청한다', async () => {
    get.mockResolvedValue(page(100, 7));
    await fetchContents(['hadong', 'yeongju', 'yecheon'], 0);
    expect(get).toHaveBeenCalledTimes(3);
    for (const call of get.mock.calls) expect(call[1].params.size).toBe(7);
  });

  it('hasMore는 지역별 크기로 계산한다', async () => {
    get.mockResolvedValue(page(14, 7));
    expect((await fetchContents(['hadong', 'yeongju', 'yecheon'], 0)).hasMore).toBe(true);
    expect((await fetchContents(['hadong', 'yeongju', 'yecheon'], 1)).hasMore).toBe(false);
  });
});
