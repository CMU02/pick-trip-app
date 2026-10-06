import { useState } from 'react';
import { Alert } from 'react-native';
import { toErrorMessage } from '../services/apiError';
import type { SavedItinerarySummary } from '../services/itineraryHistoryStorage';
import { shareItinerary } from '../services/shareItinerary';
import { createShareLink } from '../services/shareService';

// "저장한 여행" 카드의 공유 버튼 — 홈 미리보기(HomeContent)와 전체 목록 화면
// (SavedTripsScreen)이 똑같은 흐름을 쓰므로 훅으로 공통화한다. 결과·저장 화면과 같이
// 제목+웹 링크만 공유하고, 상세 일정은 링크 너머 웹 공유 페이지가 보여준다.
export function useItineraryShare() {
  const [sharingItineraryId, setSharingItineraryId] = useState<string | null>(null);

  const shareSavedItinerary = async (item: SavedItinerarySummary) => {
    setSharingItineraryId(item.itineraryId);
    try {
      const link = await createShareLink(item.itineraryId);
      await shareItinerary(item.title, link);
    } catch (error) {
      // 원인을 남기지 않으면 서버 응답인지 네트워크 문제인지 구분할 수 없다.
      console.warn('[itinerary] 저장한 여행 공유 링크 생성 실패', {
        itineraryId: item.itineraryId,
        error,
      });
      Alert.alert('공유 링크 생성 실패', toErrorMessage(error, '잠시 후 다시 시도해주세요.'));
    } finally {
      setSharingItineraryId(null);
    }
  };

  return { sharingItineraryId, shareSavedItinerary };
}
