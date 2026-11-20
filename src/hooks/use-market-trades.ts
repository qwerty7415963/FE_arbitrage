'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarketTrades } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import type { MarketTradeRow } from '@/types/trader';
import type { Meta } from '@/types/api';

export interface MarketTradesParams {
  market?: string;
  marketId?: string;
  venue?: string;
  from?: string;
  to?: string;
  side?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
  signal?: AbortSignal;
}

function normalize(args: unknown[]): MarketTradesParams & { market: string } {
  if (typeof args[0] === 'string') {
    const p = (args[1] && typeof args[1] === 'object' ? args[1] : {}) as MarketTradesParams;
    return { market: args[0], ...p };
  }
  const p = (args[0] && typeof args[0] === 'object' ? args[0] : {}) as MarketTradesParams;
  return { market: p.market ?? p.marketId ?? '', ...p };
}

export interface UseMarketTradesResult {
  data: { data: MarketTradeRow[]; meta: Meta } | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useMarketTrades(...args: unknown[]): UseMarketTradesResult {
  const { market, venue, from, to, side, page, limit, enabled, signal } = normalize(args);
  const query = useQuery({
    queryKey: [
      'market-trades',
      market,
      venue ?? 'hyperliquid',
      from,
      to,
      side ?? 'all',
      page ?? 1,
      limit ?? 20,
    ],
    queryFn: () =>
      fetchMarketTrades(market, {
        venue,
        from,
        to,
        side,
        page,
        limit,
        signal,
      }),
    enabled: Boolean((enabled ?? true) && market),
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 60_000,
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
