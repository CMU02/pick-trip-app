interface LoginTransitionDeps {
  clearItems: () => Promise<void>;
  setIsGuest: (value: boolean) => void;
}

// 로그인 성공 시점에만 부른다(앱 재시작 시 토큰 복원은 해당 없음). 게스트로 담은 항목과
// 그 우선순위·희망 체류시간이 로그인 세션으로 따라오지 않도록 비운다. 여행 조건은 유지한다.
export function completeLogin({ clearItems, setIsGuest }: LoginTransitionDeps): void {
  // 비우기 실패가 로그인 완료를 막으면 안 되므로 기다리지 않고 경고만 남긴다.
  clearItems().catch((error) => console.warn('[auth] 게스트 바구니 초기화 실패', error));
  setIsGuest(false);
}
