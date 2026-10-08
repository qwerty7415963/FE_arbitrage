'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderPerformance } from '@/services/traders';
import { DEFAULT_TRADER_PERIOD, type PerformanceSnapshot, type TraderPeriod } from '@/types/trader';

export interface TraderPerformanceOptions {
  period?: TraderPeriod;
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
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-performance', wallet, period],
    queryFn: () => fetchTraderPerformance(wallet, { period }),
    enabled,
    staleTime: 15_000,
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
