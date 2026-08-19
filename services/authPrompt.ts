// apiClient.ts의 setOnSessionExpired와 같은 패턴: AppStateContext(네비게이션에 접근 못함)가
// 로그인이 필요한 상황(예: 게스트의 찜하기 시도)을 만나면, 실제 네비게이션 호출은
// App.tsx에서 등록해둔 콜백에 위임한다.
let onRequireLogin: (() => void) | null = null;

export function setOnRequireLogin(callback: () => void): void {
  onRequireLogin = callback;
}

export function promptLogin(): void {
  onRequireLogin?.();
}
