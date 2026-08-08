import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchContents } from '../services/contentService';

export function useContents(regionIds: string[]) {
  const query = useInfiniteQuery({
    queryKey: ['contents', regionIds],
    queryFn: ({ pageParam }) => fetchContents(regionIds, pageParam),
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
