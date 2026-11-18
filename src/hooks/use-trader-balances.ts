'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderBalances } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import type { BalancesSnapshot } from '@/types/trader';

export interface UseTraderBalancesResult {
  balances: BalancesSnapshot | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useTraderBalances(
  walletAddress: string,
  options: { enabled?: boolean } = {},
): UseTraderBalancesResult {
  const wallet = walletAddress.toLowerCase();
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-balances', wallet],
    queryFn: () => fetchTraderBalances(wallet),
    enabled,
    // Selective retry on transient failures (429/408/5xx, max 2); otherwise fail fast to error UI with manual retry.
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return {
    balances: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
