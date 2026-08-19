import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_PREFIX } from '../constants/api';
import type { ApiErrorResponse } from '../types/apiError';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './authStorage';

const NETWORK_ERROR: ApiErrorResponse = {
  code: 'NETWORK_ERROR',
  message: '인터넷 연결을 확인해주세요.',
  traceId: '',
};

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: () => void): void {
  onSessionExpired = callback;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const { data } = await axios.post<RefreshResponse>(
      `${API_BASE_URL}${API_PREFIX}/auth/token/refresh`,
      { refreshToken },
    );
    await saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

apiClient.interceptors.request.use(async (config) => {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch {
    // 토큰 조회 실패는 무시하고 인증 헤더 없이 요청을 진행한다.
  }
  return config;
});

// 401을 '세션 만료'로 볼지 판단한다.
// 요청 인터셉터는 토큰이 있을 때만 Authorization을 붙인다. 헤더 없이 나간 요청이
// 401을 받았다면 로그인한 적 없는 게스트가 보호된 엔드포인트를 부른 것이므로,
// 만료가 아니다. 이 경우 토큰을 지우거나 만료 알림을 띄우면 안 된다.
export function wasAuthenticatedRequest(config?: InternalAxiosRequestConfig): boolean {
  return Boolean(config?.headers?.Authorization);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      wasAuthenticatedRequest(original)
    ) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        return apiClient(original);
      }
      await clearTokens();
      onSessionExpired?.();
    }

    if (error.response?.data) {
      // TEMP DEBUG (원인 조사용, 확인 끝나면 제거): 어느 요청에서 실패했는지 알 수 없으면
      // 재현/진단이 어려워서 method+url을 같이 남긴다.
      console.warn(
        '[apiClient] 요청 실패',
        original?.method?.toUpperCase(),
        original?.url,
        'body:',
        original?.data,
        error.response.data,
      );
      return Promise.reject(error.response.data);
    }
    return Promise.reject(NETWORK_ERROR);
  },
);
