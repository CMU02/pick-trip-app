import type { CurrentUser } from '../types/user';
import { apiClient } from './apiClient';

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
