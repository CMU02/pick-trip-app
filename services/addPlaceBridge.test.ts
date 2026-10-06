import { describe, expect, it, vi } from 'vitest';
import { consumeAddPlace, setAddPlaceHandler } from './addPlaceBridge';

describe('addPlaceBridge', () => {
  it('등록한 핸들러에 고른 장소를 넘긴다', () => {
    const handler = vi.fn();
    setAddPlaceHandler(handler);
    consumeAddPlace('c1');
    expect(handler).toHaveBeenCalledWith('c1');
  });

  // 한 번 고르면 끝 — 뒤로 갔다 다시 들어온 화면에서 이전 핸들러가 또 불리면 안 된다.
  it('한 번 쓰면 비운다', () => {
    const handler = vi.fn();
    setAddPlaceHandler(handler);
    consumeAddPlace('c1');
    consumeAddPlace('c2');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
