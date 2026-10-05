import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchContents } from '../services/contentService';

// splitAcrossRegions: 한 페이지 크기를 지역 수로 나눠 받는다. 다음 페이지를 불러오는 탐색 화면 전용.
export function useContents(regionIds: string[], { splitAcrossRegions = false } = {}) {
  const query = useInfiniteQuery({
    queryKey: ['contents', regionIds, splitAcrossRegions],
    queryFn: ({ pageParam }) => fetchContents(regionIds, pageParam, splitAcrossRegions),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
    enabled: regionIds.length > 0,
  });

  const allItems = query.data?.pages.flatMap((page) => page.items) ?? [];
  const contents = Array.from(new Map(allItems.map((item) => [item.id, item])).values());

  return {
    contents,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
