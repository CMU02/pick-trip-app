import type { ApiErrorResponse } from '../types/apiError';

// apiClient는 서버 응답 본문(ApiErrorResponse) 또는 NETWORK_ERROR 형태로 reject한다.
// 둘 다 message를 갖고 있으므로 그대로 쓰고, 그 밖의 형태(코드 버그로 던져진 Error 등)면
// 내부 문구가 새지 않도록 호출부가 준 기본 문구로 물러난다.
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const { message } = error as Partial<ApiErrorResponse>;
    if (typeof message === 'string' && message !== '') return message;
  }
  return fallback;
}
