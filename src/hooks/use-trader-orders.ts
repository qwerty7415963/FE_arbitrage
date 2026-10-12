'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderOrders } from '@/services/traders';
import { traderDataRefetchInterval } from '@/lib/trader-poll';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import { ORDERS_LIMIT_DEFAULT, type OrderStatusFilter, type OrdersPage } from '@/types/trader';

export interface TraderOrdersOptions {
  status?: OrderStatusFilter;
  limit?: number;
  enabled?: boolean;
}

export interface UseTraderOrdersResult {
  orders: OrdersPage | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useTraderOrders(
  walletAddress: string,
  options: TraderOrdersOptions = {},
): UseTraderOrdersResult {
  const wallet = walletAddress.toLowerCase();
  const status = options.status ?? 'open';
  const limit = options.limit ?? ORDERS_LIMIT_DEFAULT;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-orders', wallet, status, limit],
    queryFn: () => fetchTraderOrders(wallet, { status, limit }),
    enabled,
    // Selective retry on transient failures (429/408/5xx, max 2); otherwise fail fast to error UI with manual retry.
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 15_000,
    refetchInterval: traderDataRefetchInterval,
  });

  return {
    orders: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
