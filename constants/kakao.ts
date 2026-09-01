// 카카오맵 JS SDK를 부를 때 쓰는 JavaScript 키. 로그인에 쓰는 카카오 REST API 키와는
// 다른 키다 — 카카오 디벨로퍼스(developers.kakao.com) 앱의 "앱 키 > JavaScript 키"에서 발급받는다.
// 아직 발급 전이면 빈 문자열이고, 이 경우 지도 자리에 안내 문구를 대신 보여준다
// (screens/ContentDetailScreen.tsx 참고).
export const KAKAO_MAP_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY ?? '';
