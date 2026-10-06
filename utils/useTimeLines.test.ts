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

  // 시각 범위의 하이픈은 글머리표가 아니다 — 뒤에 숫자가 오거나, 앞에 공백이 있고 같은 줄에
  // 앞선 "~" 범위가 없으면 쪼개지 않는다.
  it('"09:00 - 18:00" 같은 시각 범위는 한 줄로 둔다', () => {
    expect(toUseTimeLines('09:00 - 18:00')).toEqual([{ kind: 'text', text: '09:00 - 18:00' }]);
    expect(toUseTimeLines('09:00  -  18:00')).toEqual([{ kind: 'text', text: '09:00  -  18:00' }]);
    expect(toUseTimeLines('10:00-12:00')).toEqual([{ kind: 'text', text: '10:00-12:00' }]);
    expect(toUseTimeLines('18:00 - 익일 02:00')).toEqual([
      { kind: 'text', text: '18:00 - 익일 02:00' },
    ]);
    expect(toUseTimeLines('오전 9시 - 오후 6시')).toEqual([
      { kind: 'text', text: '오전 9시 - 오후 6시' },
    ]);
    expect(toUseTimeLines('09:00 - (입장마감 17:00)')).toEqual([
      { kind: 'text', text: '09:00 - (입장마감 17:00)' },
    ]);
  });

  // 같은 줄에 "~" 범위가 이미 나왔다면 그 뒤 " - "는 범위가 아니라 다음 항목이다 (실제 데이터).
  it('"~" 범위 뒤의 " - "는 글머리표로 나눈다', () => {
    expect(toUseTimeLines('- 11:00~17:00 - 마지막 주문 16:45')).toEqual([
      { kind: 'item', text: '11:00~17:00' },
      { kind: 'item', text: '마지막 주문 16:45' },
    ]);
    expect(
      toUseTimeLines(
        '- 하절기(3월~10월) 10:00~18:00 (입장 마감 17:30) - 동절기(11월~2월) 10:00~17:00 (입장 마감 16:30)',
      ),
    ).toEqual([
      { kind: 'item', text: '하절기(3월~10월) 10:00~18:00 (입장 마감 17:30)' },
      { kind: 'item', text: '동절기(11월~2월) 10:00~17:00 (입장 마감 16:30)' },
    ]);
    expect(
      toUseTimeLines(
        '[화요일~목요일]  - 11:30~14:00 [금요일] - 11:30~20:00  - 점심 마지막 주문 14:00  - 준비시간 14:00~17:00[주말]  - 11:30~20:00  - 준비시간 15:00~17:00',
      ),
    ).toEqual([
      { kind: 'header', text: '화요일~목요일' },
      { kind: 'item', text: '11:30~14:00' },
      { kind: 'header', text: '금요일' },
      { kind: 'item', text: '11:30~20:00' },
      { kind: 'item', text: '점심 마지막 주문 14:00' },
      { kind: 'item', text: '준비시간 14:00~17:00' },
      { kind: 'header', text: '주말' },
      { kind: 'item', text: '11:30~20:00' },
      { kind: 'item', text: '준비시간 15:00~17:00' },
    ]);
  });

  it('구분 없는 한 줄은 그대로', () => {
    expect(toUseTimeLines('상시 개방')).toEqual([{ kind: 'text', text: '상시 개방' }]);
  });
});
