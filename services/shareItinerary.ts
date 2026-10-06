import { Share } from 'react-native';

// 일정 목록을 글로 풀어 보내던 방식 대신, 제목 + 웹 링크만 보낸다. 메신저가 링크를
// 미리보기 카드로 바꿔 보여주고, 상세 일정은 링크 너머 웹 페이지가 UI로 보여준다.
export async function shareItinerary(title: string, url: string): Promise<void> {
  try {
    await Share.share({ title, message: `[PickTrip] ${title}\n${url}` });
  } catch {
    // 공유 시트 취소/드문 네이티브 오류 — 사용자에게 별도 알릴 필요 없음
  }
}
