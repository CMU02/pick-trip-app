// 장소 추가 화면(AddPlaceScreen)에서 고른 장소를, 그 화면을 연 일정 화면의 로컬 stops에
// 넣기 위한 통로. 라우트 params에 콜백을 넣으면 직렬화 경고가 나고, 일정 화면의 stops는
// 로컬 state라 전역 상태로 옮기기엔 범위가 커서 모듈 변수 하나로 잇는다.
// ponytail: 핸들러 하나만 보관 — 장소 추가 화면은 동시에 하나만 열린다. 앱이 백그라운드에서
// 종료 후 상태 복원되면 핸들러가 사라져 선택이 무시된다(화면만 닫힘). 그게 문제되면 AppStateContext로 옮긴다.
let pending: ((contentId: string) => void) | null = null;

export function setAddPlaceHandler(handler: (contentId: string) => void): void {
  pending = handler;
}

export function consumeAddPlace(contentId: string): void {
  const handler = pending;
  pending = null;
  handler?.(contentId);
}
