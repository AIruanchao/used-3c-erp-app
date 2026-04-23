import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { AxiosError } from 'axios';

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UsePaginatedListOptions<T, P> {
  queryKey: QueryKey;
  queryFn: (params: P & { page: number; pageSize: number; signal?: AbortSignal }) => Promise<PageResult<T>>;
  params: P;
  enabled?: boolean;
  pageSize?: number;
  staleTime?: number;
}

export function usePaginatedList<T, P extends object>({
  queryKey,
  queryFn,
  params,
  enabled = true,
  pageSize = 20,
  staleTime = 30_000,
}: UsePaginatedListOptions<T, P>) {
  const query = useInfiniteQuery<PageResult<T>, AxiosError, InfiniteData<PageResult<T>>, QueryKey, number>({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      return queryFn({ ...params, page: pageParam, pageSize, signal });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled,
    staleTime,
    gcTime: 300_000,
    retry: 2,
  });

  const items = useMemo(() => {
    const all: T[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) {
        all.push(item);
      }
    }
    return all;
  }, [query.data?.pages]);

  const total = query.data?.pages[0]?.total ?? 0;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    items,
    total,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    loadMore,
    refresh,
    error: query.error,
  };
}
