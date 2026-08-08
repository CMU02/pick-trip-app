import type { Content, ContentCategory } from '../types/content';
import { apiClient } from './apiClient';

interface ContentSummaryResponse {
  contentId: string;
  title: string;
  contentTypeId: number;
  address: string;
  firstImage: string;
  latitude: number;
  longitude: number;
  category: string;
  summary: string | null;
  indoor: boolean;
  region: string;
}

interface ContentListResponse {
  totalCount: number;
  page: number;
  size: number;
  items: ContentSummaryResponse[];
}

const MAX_PAGE_SIZE = 40;

function toContent(item: ContentSummaryResponse): Content {
  return {
    id: item.contentId,
    regionId: item.region.toLowerCase(),
    name: item.title,
    category: item.category.toLowerCase() as ContentCategory,
    summary: item.summary ?? '',
    address: item.address,
    imageUrl: item.firstImage || null,
    indoor: item.indoor,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

export interface ContentPage {
  items: Content[];
  hasMore: boolean;
}

async function fetchContentsPage(
  regionId: string,
  page: number,
): Promise<{ items: Content[]; totalCount: number }> {
  const { data } = await apiClient.get<ContentListResponse>('/contents', {
    params: { region: regionId.toUpperCase(), page, size: MAX_PAGE_SIZE },
  });
  return { items: data.items.map(toContent), totalCount: data.totalCount };
}

export async function fetchContents(regionIds: string[], page: number): Promise<ContentPage> {
  const results = await Promise.all(regionIds.map((regionId) => fetchContentsPage(regionId, page)));
  return {
    items: results.flatMap((r) => r.items),
    hasMore: results.some((r) => (page + 1) * MAX_PAGE_SIZE < r.totalCount),
  };
}

interface ContentDetailResponse {
  contentId: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  summary: string | null;
  category: string;
  indoor: boolean;
  region: string;
  images: { imageUrl: string; title: string }[];
}

function toContentFromDetail(item: ContentDetailResponse): Content {
  return {
    id: item.contentId,
    regionId: item.region.toLowerCase(),
    name: item.title,
    category: item.category.toLowerCase() as ContentCategory,
    summary: item.summary ?? '',
    address: item.address,
    imageUrl: item.images[0]?.imageUrl ?? null,
    indoor: item.indoor,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

export async function fetchContentDetail(contentId: string): Promise<Content> {
  const { data } = await apiClient.get<ContentDetailResponse>(`/contents/${contentId}`);
  return toContentFromDetail(data);
}
