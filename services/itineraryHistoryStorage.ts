import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pick-trip:itinerary-history';

// 이 개수를 넘으면 오래된 것부터 버린다. 무한정 쌓아둘 이유가 없고, 기기 저장소도 아껴야 한다.
const MAX_ENTRIES = 20;

// 로그인 사용자의 저장된 일정을 "전체 목록"으로 주는 API는 없다(단건 조회만 존재, 웹팀 확인 완료).
// 그래서 이 앱에서 저장(POST/PATCH /itineraries)할 때마다 요약을 기기에 계속 쌓아두고,
// 홈/마이페이지에서 "저장한 여행" 목록처럼 보여준다.
//
// 한계: 이 기기·이 앱에서 저장한 것만 보인다. 다른 기기나 웹에서 저장한 일정, 또는 이 기능이
// 생기기 전에 저장했던 일정은 여기 안 잡힌다 — 진짜 "계정 기준 전체 목록"이 필요해지면
// 결국 백엔드 목록 API가 있어야 한다.
export interface SavedItinerarySummary {
  itineraryId: string;
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  savedAt: string;
}

export async function recordItineraryHistory(
  entry: SavedItinerarySummary,
): Promise<SavedItinerarySummary[]> {
  const current = await loadItineraryHistory();
  // 같은 일정을 다시 저장(수정)한 거면 기존 항목을 지우고 맨 앞으로 올린다.
  const next = [entry, ...current.filter((item) => item.itineraryId !== entry.itineraryId)].slice(
    0,
    MAX_ENTRIES,
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function loadItineraryHistory(): Promise<SavedItinerarySummary[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SavedItinerarySummary[]) : [];
}

// "저장한 여행" 목록에서 카드를 지운다. 서버에 저장된 일정 자체를 지우는 API는 없어서
// (백엔드에 단건 삭제 엔드포인트가 없음), 이 기기의 목록에서만 안 보이게 하는 것이다.
export async function removeItineraryHistory(
  itineraryId: string,
): Promise<SavedItinerarySummary[]> {
  const current = await loadItineraryHistory();
  const next = current.filter((item) => item.itineraryId !== itineraryId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
