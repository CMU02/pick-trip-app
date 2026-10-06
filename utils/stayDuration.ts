// 콘텐츠 상세의 "예상 체류"(stayDuration)는 서버가 사람이 읽을 문장으로 준다("약 2~3시간",
// "1시간 30분"). 우선순위 화면의 체류시간 스테퍼는 분 단위 숫자가 필요해서, 그 문장의
// 하한을 분으로 뽑는다. 범위의 짧은 쪽을 쓰는 건, 길게 잡으면 일정 전체가 밀리기 때문이다.

// 희망 체류시간 스테퍼 범위. 서버 검증(10~480분, 10분 단위)과 맞춘다.
export const STAY_MIN_MINUTES = 10;
export const STAY_MAX_MINUTES = 480;
export const STAY_STEP_MINUTES = 10;
const STAY_FALLBACK_MINUTES = 60;

export function parseStayDurationMinutes(text: string | null): number | null {
  if (!text) return null;
  const first = text.split(/[~\-–]/)[0];
  const hours = first.match(/(\d+(?:\.\d+)?)\s*시간/);
  const minutes = first.match(/(\d+)\s*분/);
  if (hours || minutes) {
    return Math.round((hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0));
  }
  // "2~3시간"처럼 단위가 범위 뒤에만 붙은 경우 — 앞 숫자에 문장 전체의 단위를 붙인다.
  const bare = first.match(/(\d+(?:\.\d+)?)/);
  if (!bare) return null;
  if (text.includes('시간')) return Math.round(Number(bare[1]) * 60);
  if (text.includes('분')) return Math.round(Number(bare[1]));
  return null;
}

export function defaultStayMinutes(text: string | null): number {
  const parsed = parseStayDurationMinutes(text) ?? STAY_FALLBACK_MINUTES;
  const stepped = Math.round(parsed / STAY_STEP_MINUTES) * STAY_STEP_MINUTES;
  return Math.min(STAY_MAX_MINUTES, Math.max(STAY_MIN_MINUTES, stepped));
}
