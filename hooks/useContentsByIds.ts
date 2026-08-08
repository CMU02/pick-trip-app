import { useQueries } from '@tanstack/react-query';
import { fetchContentDetail } from '../services/contentService';
import type { Content } from '../types/content';

export function useContentsByIds(contentIds: string[]) {
  const results = useQueries({
    queries: contentIds.map((id) => ({
      queryKey: ['content-detail', id],
      queryFn: () => fetchContentDetail(id),
    })),
  });

  const contents = results
    .map((result) => result.data)
    .filter((content): content is Content => content !== undefined);

  return {
    contents,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    refetch: () => Promise.all(results.map((result) => result.refetch())),
  };
}
