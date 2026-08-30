import AsyncStorage from '@react-native-async-storage/async-storage';

const HIDDEN_KEY = 'pick-trip:hidden-itinerary-ids';

// "저장한 여행" 목록에서 홈/마이페이지 카드에 쓰는 요약 정보.
// services/itineraryService.ts의 listItineraryPlans()가 GET /itineraries 응답을 이 형태로 매핑한다.
export interface SavedItinerarySummary {
  itineraryId: string;
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  savedAt: string;
}

// 2026-08-26에 백엔드팀이 GET /itineraries(목록)를 배포하면서, "저장한 여행" 목록은 이제
// 이 API에서 직접 받아온다(contexts/AppStateContext.tsx 참고) — 예전엔 목록 API가 없어서
// 저장할 때마다 요약을 기기에 쌓아두는 방식으로 임시 구현했었다.
//
// 다만 단건 삭제(DELETE /itineraries/{id}) API는 아직 확인 전이라, "삭제"는 여전히 이 기기에서만
// 안 보이게 숨기는 방식으로 처리한다 — 여기 남은 id는 매번 새로 받아온 서버 목록에서 걸러낸다.
export async function loadHiddenItineraryIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(HIDDEN_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function hideItineraryId(itineraryId: string): Promise<string[]> {
  const current = await loadHiddenItineraryIds();
  const next = Array.from(new Set([...current, itineraryId]));
  await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  return next;
}
