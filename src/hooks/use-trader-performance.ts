'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderPerformance } from '@/services/traders';
import { traderDataRefetchInterval } from '@/lib/trader-poll';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  DEFAULT_TRADER_PERIOD,
  type PerformanceSnapshot,
  type PortfolioMode,
  type TraderPeriod,
} from '@/types/trader';

export interface TraderPerformanceOptions {
  period?: TraderPeriod;
  mode?: PortfolioMode;
  seriesOnly?: boolean;
  enabled?: boolean;
}

export interface UseTraderPerformanceResult {
  performance: PerformanceSnapshot | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useTraderPerformance(
  walletAddress: string,
  options: TraderPerformanceOptions = {},
): UseTraderPerformanceResult {
  const wallet = walletAddress.toLowerCase();
  const period = options.period ?? DEFAULT_TRADER_PERIOD;
  const mode = options.mode ?? 'perps';
  const seriesOnly = options.seriesOnly ?? false;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-performance', wallet, period, mode, seriesOnly],
    queryFn: () => fetchTraderPerformance(wallet, { period, mode, seriesOnly }),
    enabled,
    // Selective retry on transient failures (429/408/5xx, max 2); otherwise fail fast to error UI with manual retry.
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 30_000,
    refetchInterval: traderDataRefetchInterval,
  });

  return {
    performance: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
