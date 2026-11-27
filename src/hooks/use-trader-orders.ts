'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTraderOrders } from '@/services/traders';
import { subscribeWalletLive } from '@/lib/wallet-live';
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
  live?: string;
}

export function useTraderOrders(
  walletAddress: string,
  options: TraderOrdersOptions = {},
): UseTraderOrdersResult {
  const wallet = walletAddress.toLowerCase();
  const status = options.status ?? 'open';
  const limit = options.limit ?? ORDERS_LIMIT_DEFAULT;
  const enabled = (options.enabled ?? true) && wallet.length > 0;
  const queryClient = useQueryClient();
  const [wsLive, setWsLive] = useState(false);

  const query = useQuery({
    queryKey: ['trader-orders', wallet, status, limit],
    queryFn: () => fetchTraderOrders(wallet, { status, limit }),
    enabled,
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 30_000,
    refetchInterval: (q) => {
      if (q.state.status === 'error') return false;
      return wsLive ? 0 : 60_000;
    },
  });

  useEffect(() => {
    if (!wallet || !enabled) return;
    const unsub = subscribeWalletLive(wallet, ['orders'], {
      onBootstrap: (channel, data) => {
        if (channel !== 'orders') return;
        let page: OrdersPage | null = null;
        if (Array.isArray(data)) {
          page = { status, rows: data as OrdersPage['rows'] };
        } else if (data && typeof data === 'object') {
          const d = data as Partial<OrdersPage>;
          page = { status: d.status ?? status, rows: d.rows ?? [] };
        }
        if (page) {
          if (Array.isArray(page.rows) && page.rows.length === 0) {
            const cached = queryClient.getQueryData<OrdersPage>([
              'trader-orders',
              wallet,
              status,
              limit,
            ]);
            if (cached && Array.isArray(cached.rows) && cached.rows.length > 0) {
              return;
            }
          }
          queryClient.setQueryData<OrdersPage>(['trader-orders', wallet, status, limit], page);
        }
      },
      onOrder: (order) => {
        queryClient.setQueryData<OrdersPage>(['trader-orders', wallet, status, limit], (old) => {
          if (!old) return old;
          const rows = old.rows.map((r) =>
            r.oid === order.oid ? ({ ...r, ...order } as typeof r) : r,
          );
          // if not found, append
          if (!old.rows.some((r) => r.oid === order.oid))
            rows.unshift(order as unknown as (typeof rows)[number]);
          return { ...old, rows };
        });
      },
      onOrderCreated: (order) => {
        queryClient.setQueryData<OrdersPage>(['trader-orders', wallet, status, limit], (old) => {
          const base = old ?? { status, rows: [] };
          if (base.rows.some((r) => r.oid === order.oid)) return base;
          return { ...base, rows: [order as unknown as (typeof base.rows)[number], ...base.rows] };
        });
      },
      onStatus: (s) => setWsLive(s === 'connected'),
    });
    return unsub;
  }, [wallet, status, limit, enabled, queryClient]);

  return {
    orders: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    live: wsLive ? 'connected' : 'disconnected',
  };
}
