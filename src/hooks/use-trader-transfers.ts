'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTraderTransfers } from '@/services/traders';
import { traderDataRefetchInterval } from '@/lib/trader-poll';
import { TRANSFERS_DAYS_DEFAULT, TRANSFERS_LIMIT_DEFAULT, type TransferRow } from '@/types/trader';

export interface TraderTransfersOptions {
  days?: number;
  limit?: number;
  enabled?: boolean;
}

export interface UseTraderTransfersResult {
  transfers: TransferRow[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  refetch: () => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
}

export function useTraderTransfers(
  walletAddress: string,
  options: TraderTransfersOptions = {},
): UseTraderTransfersResult {
  const wallet = walletAddress.toLowerCase();
  const days = options.days ?? TRANSFERS_DAYS_DEFAULT;
  const limit = options.limit ?? TRANSFERS_LIMIT_DEFAULT;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useInfiniteQuery({
    queryKey: ['trader-transfers', wallet, days, limit],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchTraderTransfers(wallet, { days, limit, cursor: pageParam }),
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    // Fail fast to error UI; recovery is manual retry or 30s poll, not hidden retries.
    retry: false,
    staleTime: 15_000,
    refetchInterval: traderDataRefetchInterval,
  });

  const transfers = (query.data?.pages ?? []).flatMap((page) => page?.rows ?? []);

  return {
    transfers,
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
