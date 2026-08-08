import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../services/userService';

export function useCurrentUser(enabled: boolean) {
  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    enabled,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
  };
}
