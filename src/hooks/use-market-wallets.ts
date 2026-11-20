'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarketWallets } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import type { MarketWalletRow } from '@/types/trader';
import type { Meta } from '@/types/api';

export interface MarketWalletsParams {
  market?: string;
  marketId?: string;
  venue?: string;
  from?: string;
  to?: string;
  win_rate_min?: number;
  trades_min?: number;
  last_trade_after?: string;
  groups?: string;
  sort?: string;
  dir?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
  signal?: AbortSignal;
}

function normalize(args: unknown[]): MarketWalletsParams & { market: string } {
  if (typeof args[0] === 'string') {
    const p = (args[1] && typeof args[1] === 'object' ? args[1] : {}) as MarketWalletsParams;
    return { market: args[0], ...p };
  }
  const p = (args[0] && typeof args[0] === 'object' ? args[0] : {}) as MarketWalletsParams;
  return { market: p.market ?? p.marketId ?? '', ...p };
}

export interface UseMarketWalletsResult {
  data: { data: MarketWalletRow[]; meta: Meta } | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useMarketWallets(...args: unknown[]): UseMarketWalletsResult {
  const {
    market,
    venue,
    from,
    to,
    win_rate_min,
    trades_min,
    last_trade_after,
    groups,
    sort,
    dir,
    page,
    limit,
    enabled,
    signal,
  } = normalize(args);
  const query = useQuery({
    queryKey: [
      'market-wallets',
      market,
      venue ?? 'hyperliquid',
      from,
      to,
      win_rate_min,
      trades_min,
      last_trade_after,
      groups,
      sort ?? 'volume',
      dir ?? 'desc',
      page ?? 1,
      limit ?? 20,
    ],
    queryFn: () =>
      fetchMarketWallets(market, {
        venue,
        from,
        to,
        win_rate_min,
        trades_min,
        last_trade_after,
        groups,
        sort,
        dir,
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
