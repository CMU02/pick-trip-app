import { minutesToTimeOfDay, parseTimeToMinutes } from './tripDate';

// 시간 선택 모달에 늘어놓을 "HH:MM" 목록. 서버 검증 범위를 그대로 받아 양 끝을 포함한다.
export function buildTimeOptions(min: string, max: string, stepMinutes: number): string[] {
  const start = parseTimeToMinutes(min) ?? 0;
  const end = parseTimeToMinutes(max) ?? 0;
  const options: string[] = [];
  for (let m = start; m <= end; m += stepMinutes) options.push(minutesToTimeOfDay(m));
  return options;
}
