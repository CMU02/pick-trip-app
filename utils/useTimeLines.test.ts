import { describe, expect, it } from 'vitest';
import { toUseTimeLines } from './useTimeLines';

describe('toUseTimeLines', () => {
  it('[구분]·글머리표·※ 안내를 줄로 나눈다 (금오산랜드 실제 데이터)', () => {
    const raw =
      '[숙박]- 입실 14:00- 퇴실 11:00[물썰매장]10:00~17:00(입장 마감 15:00)<br>[눈썰매장]10:00~16:00(입장 마감 15:00)※ 자세한 사항은 홈페이지 참조';
    expect(toUseTimeLines(raw)).toEqual([
      { kind: 'header', text: '숙박' },
      { kind: 'item', text: '입실 14:00' },
      { kind: 'item', text: '퇴실 11:00' },
      { kind: 'header', text: '물썰매장' },
      { kind: 'text', text: '10:00~17:00(입장 마감 15:00)' },
      { kind: 'header', text: '눈썰매장' },
      { kind: 'text', text: '10:00~16:00(입장 마감 15:00)' },
      { kind: 'note', text: '※ 자세한 사항은 홈페이지 참조' },
    ]);
  });

  it('<br> 뒤 글머리표를 항목으로 만든다', () => {
    expect(toUseTimeLines('11:30~18:00<br>- 마지막 주문 17:00')).toEqual([
      { kind: 'text', text: '11:30~18:00' },
      { kind: 'item', text: '마지막 주문 17:00' },
    ]);
  });

  // 시각 범위의 하이픈은 글머리표가 아니다 — 뒤에 숫자가 오면 쪼개지 않는다.
  it('"09:00 - 18:00" 같은 시각 범위는 한 줄로 둔다', () => {
    expect(toUseTimeLines('09:00 - 18:00')).toEqual([{ kind: 'text', text: '09:00 - 18:00' }]);
    expect(toUseTimeLines('09:00  -  18:00')).toEqual([{ kind: 'text', text: '09:00  -  18:00' }]);
    expect(toUseTimeLines('10:00-12:00')).toEqual([{ kind: 'text', text: '10:00-12:00' }]);
  });

  it('구분 없는 한 줄은 그대로', () => {
    expect(toUseTimeLines('상시 개방')).toEqual([{ kind: 'text', text: '상시 개방' }]);
  });
});
