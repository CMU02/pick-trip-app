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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
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
      return Promise.reject(error.response.data);
    }
    return Promise.reject(NETWORK_ERROR);
  },
);
