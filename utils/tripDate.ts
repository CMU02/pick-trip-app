import type { DurationType } from '../types/trip';

// Date를 로컬 기준 yyyy-mm-dd로 만든다.
// toISOString()은 UTC로 바꾸므로, 로컬 자정으로 만든 날짜(날짜 선택기가 만드는 값)가
// UTC+ 지역에서는 하루 앞으로 밀린다. KST에서 8월 9일을 고르면 2026-08-08이 된다.
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// yyyy-mm-dd를 로컬 자정 Date로 되돌린다.
// new Date('2026-08-09')는 UTC 자정으로 해석되어 UTC- 지역에서 전날이 된다.
export function fromDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// 저장된 박 수로부터 날짜 선택기가 쓰는 기간 종류를 되돌린다.
export function toDurationType(nights: number): DurationType {
  if (nights <= 0) return 'day';
  if (nights === 1) return '1night';
  if (nights === 2) return '2night';
  return 'custom';
}
