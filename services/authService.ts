import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../constants/api';
import type { ApiErrorResponse } from '../types/apiError';
import { apiClient } from './apiClient';
import { clearTokens, saveTokens } from './authStorage';

export type AuthProvider = 'kakao' | 'google';

interface OAuthExchangeResponse {
  accessToken: string;
  refreshToken: string;
}

function generateNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function loginWithProvider(
  provider: AuthProvider,
): Promise<{ success: true } | { success: false; message: string }> {
  const nonce = generateNonce();
  const redirectUri = Linking.createURL('auth/callback');
  const authUrl = `${API_BASE_URL}/oauth2/authorization/${provider}?nonce=${encodeURIComponent(nonce)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== 'success') {
    return { success: false, message: '로그인이 취소되었습니다.' };
  }

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  if (typeof code !== 'string') {
    return { success: false, message: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }

  try {
    const { data } = await apiClient.post<OAuthExchangeResponse>('/auth/oauth/exchange', {
      code,
      nonce,
    });
    await saveTokens(data.accessToken, data.refreshToken);
    return { success: true };
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    return {
      success: false,
      message: apiError.message ?? '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.delete('/auth/logout');
  } catch {
    // 서버 로그아웃 실패해도 로컬 토큰은 지운다.
  }
  await clearTokens();
}
