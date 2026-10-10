'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderDetail } from '@/services/traders';
import { traderDataRefetchInterval } from '@/lib/trader-poll';
import { DEFAULT_TRADER_PERIOD, type TraderDetail, type TraderPeriod } from '@/types/trader';

export interface TraderDetailOptions {
  period?: TraderPeriod;
  enabled?: boolean;
}

export interface UseTraderDetailResult {
  detail: TraderDetail | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Trader overview (detail header + metric cards). Mounted page polls every
 * 30s (`traderDataRefetchInterval`); error stops polling and needs a manual
 * retry via `refetch`. Background tabs pause automatically (react-query
 * default); unmount clears the timer.
 */
export function useTraderDetail(
  walletAddress: string,
  options: TraderDetailOptions = {},
): UseTraderDetailResult {
  const wallet = walletAddress.toLowerCase();
  const period = options.period ?? DEFAULT_TRADER_PERIOD;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-detail', wallet, period],
    queryFn: () => fetchTraderDetail(wallet, { period }),
    enabled,
    // Fail fast to error UI; recovery is manual retry or 30s poll, not hidden retries.
    retry: false,
    refetchInterval: traderDataRefetchInterval,
  });

  return {
    detail: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
