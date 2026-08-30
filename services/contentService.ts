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

// 탐색 화면 "더보기" 단위와 맞춘 페이지 크기. 너무 크면 첫 화면 로딩이 오래 걸린다.
const PAGE_SIZE = 20;

function toContent(item: ContentSummaryResponse): Content {
  return {
    id: item.contentId,
    regionId: item.region.toLowerCase(),
    name: item.title,
    category: item.category.toLowerCase() as ContentCategory,
    summary: item.summary ?? '',
    address: item.address,
    imageUrl: item.firstImage || null,
    images: item.firstImage ? [item.firstImage] : [],
    indoor: item.indoor,
    latitude: item.latitude,
    longitude: item.longitude,
    // 목록 응답엔 운영시간 등 상세 정보가 없다 — 상세 조회에서만 채워진다.
    useTime: null,
    restDate: null,
    parking: null,
    stayDuration: null,
    reservationRequired: null,
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
    params: { region: regionId.toUpperCase(), page, size: PAGE_SIZE },
  });
  return { items: data.items.map(toContent), totalCount: data.totalCount };
}

export async function fetchContents(regionIds: string[], page: number): Promise<ContentPage> {
  const results = await Promise.all(regionIds.map((regionId) => fetchContentsPage(regionId, page)));
  return {
    items: results.flatMap((r) => r.items),
    hasMore: results.some((r) => (page + 1) * PAGE_SIZE < r.totalCount),
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
  useTime: string | null;
  restDate: string | null;
  parking: string | null;
  stayDuration: string | null;
  reservationRequired: string | null;
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
    images: item.images.map((image) => image.imageUrl),
    indoor: item.indoor,
    latitude: item.latitude,
    longitude: item.longitude,
    useTime: item.useTime,
    restDate: item.restDate,
    parking: item.parking,
    stayDuration: item.stayDuration,
    reservationRequired: item.reservationRequired,
  };
}

export async function fetchContentDetail(contentId: string): Promise<Content> {
  const { data } = await apiClient.get<ContentDetailResponse>(`/contents/${contentId}`);
  return toContentFromDetail(data);
}
