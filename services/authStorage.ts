import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'pick-trip.access-token';
const REFRESH_TOKEN_KEY = 'pick-trip.refresh-token';

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// 앱을 다시 켰을 때 로그인 상태를 복원할지 판단한다.
// 토큰이 유효한지까지는 보지 않는다. 만료됐다면 첫 API 호출이 401을 받고
// apiClient의 재발급 → 실패 시 onSessionExpired 경로가 게스트로 되돌린다.
export async function hasStoredSession(): Promise<boolean> {
  try {
    return (await getAccessToken()) !== null;
  } catch {
    // SecureStore 읽기 실패는 로그인 정보가 없는 것으로 간주한다.
    return false;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
