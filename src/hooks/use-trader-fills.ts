'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTraderFills } from '@/services/traders';
import { FILLS_LIMIT_DEFAULT, type TraderFillRow } from '@/types/trader';

export interface TraderFillsOptions {
  limit?: number;
  enabled?: boolean;
}

export interface UseTraderFillsResult {
  fills: TraderFillRow[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  refetch: () => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
}

export function useTraderFills(
  walletAddress: string,
  options: TraderFillsOptions = {},
): UseTraderFillsResult {
  const wallet = walletAddress.toLowerCase();
  const limit = options.limit ?? FILLS_LIMIT_DEFAULT;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useInfiniteQuery({
    queryKey: ['trader-fills', wallet, limit],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchTraderFills(wallet, { limit, cursor: pageParam }),
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: 15_000,
  });

  const fills = (query.data?.pages ?? []).flatMap((page) => page?.rows ?? []);

  return {
    fills,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    refetch: () => {
      void query.refetch();
    },
    hasMore: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
