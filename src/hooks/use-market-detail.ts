'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarketDetail } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import type { MarketDetailResponse } from '@/types/trader';

export interface MarketDetailParams {
  market?: string;
  marketId?: string;
  venue?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
  signal?: AbortSignal;
}

function normalize(args: unknown[]): MarketDetailParams & { market: string } {
  if (typeof args[0] === 'string') {
    const p = (args[1] && typeof args[1] === 'object' ? args[1] : {}) as MarketDetailParams;
    return { market: args[0], ...p };
  }
  const p = (args[0] && typeof args[0] === 'object' ? args[0] : {}) as MarketDetailParams;
  return { market: p.market ?? p.marketId ?? '', ...p };
}

export interface UseMarketDetailResult {
  data: MarketDetailResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useMarketDetail(...args: unknown[]): UseMarketDetailResult {
  const { market, venue, from, to, enabled, signal } = normalize(args);
  const query = useQuery({
    queryKey: ['market-detail', market, venue ?? 'hyperliquid', from, to],
    queryFn: () => fetchMarketDetail(market, { venue, from, to, signal }),
    enabled: Boolean((enabled ?? true) && market),
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: () => {
      void query.refetch();
    },
  };
}
