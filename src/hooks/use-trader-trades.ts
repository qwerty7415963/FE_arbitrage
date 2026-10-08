'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTraderActivity } from '@/services/traders';
import {
  ACTIVITY_LIMIT_DEFAULT,
  DEFAULT_ACTIVITY_DIR,
  DEFAULT_ACTIVITY_SORT,
  type ActivityCounts,
  type ActivityResultFilter,
  type ActivitySideFilter,
  type ActivitySortKey,
  type ActivityTrade,
  type SortDirection,
} from '@/types/trader';

export interface TraderTradesOptions {
  sort?: ActivitySortKey;
  dir?: SortDirection;
  result?: ActivityResultFilter;
  side?: ActivitySideFilter;
  limit?: number;
  enabled?: boolean;
}

export interface UseTraderTradesResult {
  trades: ActivityTrade[];
  counts: ActivityCounts | null;
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  refetch: () => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
}

const EMPTY_COUNTS: ActivityCounts = { win: 0, loss: 0, long: 0, short: 0, total: 0 };

export function useTraderTrades(
  walletAddress: string,
  options: TraderTradesOptions = {},
): UseTraderTradesResult {
  const wallet = walletAddress.toLowerCase();
  const sort = options.sort ?? DEFAULT_ACTIVITY_SORT;
  const dir = options.dir ?? DEFAULT_ACTIVITY_DIR;
  const result = options.result ?? 'all';
  const side = options.side ?? 'all';
  const limit = options.limit ?? ACTIVITY_LIMIT_DEFAULT;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useInfiniteQuery({
    queryKey: ['trader-trades', wallet, sort, dir, result, side, limit],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchTraderActivity(wallet, { sort, dir, result, side, limit, cursor: pageParam }),
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: 15_000,
  });

  const pages = query.data?.pages ?? [];
  const trades = pages.flatMap((page) => page?.rows ?? []);
  const counts = pages.length > 0 ? (pages[0]?.counts ?? EMPTY_COUNTS) : null;

  return {
    trades,
    counts,
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
