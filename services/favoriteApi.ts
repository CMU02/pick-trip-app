import type { Content } from '../types/content';
import { apiClient } from './apiClient';

interface ServerFavoriteItem {
  contentId: string;
}

interface FavoritesResponse {
  items: ServerFavoriteItem[];
}

// 찜하기는 로그인 사용자 전용이다(백엔드가 인증 없는 요청을 401로 거부함).
// 게스트는 AppStateContext.handleToggleFavorite가 서버 호출 전에 로그인을 유도해서 걸러낸다.
export async function getFavoriteIds(): Promise<string[]> {
  const { data } = await apiClient.get<FavoritesResponse>('/favorites');
  return data.items.map((item) => item.contentId);
}

export async function addFavorite(content: Content): Promise<void> {
  try {
    await apiClient.post('/favorites', {
      contentId: content.id,
      title: content.name,
      address: content.address || null,
      firstImage: content.imageUrl,
      category: content.category.toUpperCase(),
      summary: content.summary || null,
      indoor: content.indoor,
      region: content.regionId.toUpperCase(),
    });
  } catch (error) {
    // 이미 찜한 상태면 성공으로 취급한다(화면 상태와 서버 상태가 이미 일치하므로).
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'FAVORITE_DUPLICATE'
    ) {
      return;
    }
    throw error;
  }
}

export async function removeFavorite(contentId: string): Promise<void> {
  try {
    await apiClient.delete(`/favorites/${contentId}`);
  } catch (error) {
    // 이미 지워진 상태면 성공으로 취급한다.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'FAVORITE_NOT_FOUND'
    ) {
      return;
    }
    throw error;
  }
}
