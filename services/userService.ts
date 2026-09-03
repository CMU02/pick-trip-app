import type { ApiErrorResponse } from '../types/apiError';
import type { CurrentUser } from '../types/user';
import { apiClient } from './apiClient';
import { clearTokens } from './authStorage';

interface UserMeResponse {
  uid: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
  createdAt: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<UserMeResponse>('/users/me');
  return data;
}

// 회원 탈퇴(소프트 삭제). 서버가 리프레시 토큰은 즉시 폐기하지만, 이미 발급된 액세스
// 토큰은 만료(최대 1시간)까지 유효하므로 클라이언트에서 반드시 지워야 한다.
// 같은 요청을 두 번 보내도 204이고, 이미 유예 기간이 지나 하드 삭제된 계정은
// 404(USER_NOT_FOUND)로 응답한다 — 두 경우 다 로그아웃 상태로 만들면 되므로 성공으로 취급한다.
export async function withdrawAccount(): Promise<void> {
  try {
    await apiClient.delete('/users/me');
  } catch (error) {
    const apiError = error as Partial<ApiErrorResponse>;
    if (apiError.code !== 'USER_NOT_FOUND') {
      throw error;
    }
  }
  await clearTokens();
}
