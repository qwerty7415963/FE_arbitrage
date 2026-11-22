'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTraderActivity } from '@/services/traders';
import { subscribeWalletLive } from '@/lib/wallet-live';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  ACTIVITY_LIMIT_DEFAULT,
  DEFAULT_ACTIVITY_DIR,
  DEFAULT_ACTIVITY_SORT,
  type ActivityCounts,
  type ActivityPage,
  type ActivityResultFilter,
  type ActivitySideFilter,
  type ActivitySortKey,
  type ActivityTrade,
  type LiveDataStatus,
  type SortDirection,
  type WalletConnectionStatus,
} from '@/types/trader';

export interface TraderTradesOptions {
  sort?: ActivitySortKey;
  dir?: SortDirection;
  result?: ActivityResultFilter;
  side?: ActivitySideFilter;
  limit?: number;
  enabled?: boolean;
}

export interface UseTraderTradesResult {
  trades: ActivityTrade[];
  counts: ActivityCounts | null;
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  refetch: () => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
  dataStatus: LiveDataStatus;
  asOf: string | null;
  partial: boolean;
  live: string;
  connection: WalletConnectionStatus | null;
}

const EMPTY_COUNTS: ActivityCounts = { win: 0, loss: 0, long: 0, short: 0, total: 0 };

function isErrorEmptyPage(page: ActivityPage | null | undefined): boolean {
  return (
    !!page && page.data_status === 'error' && Array.isArray(page.rows) && page.rows.length === 0
  );
}

export function useTraderTrades(
  walletAddress: string,
  options: TraderTradesOptions = {},
): UseTraderTradesResult {
  const wallet = walletAddress.toLowerCase();
  const sort = options.sort ?? DEFAULT_ACTIVITY_SORT;
  const dir = options.dir ?? DEFAULT_ACTIVITY_DIR;
  const result = options.result ?? 'all';
  const side = options.side ?? 'all';
  const limit = options.limit ?? ACTIVITY_LIMIT_DEFAULT;
  const enabled = (options.enabled ?? true) && wallet.length > 0;
  const [live, setLive] = useState<string>('disconnected');
  const [connection, setConnection] = useState<WalletConnectionStatus | null>(null);
  const [wsLive, setWsLive] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ['trader-trades', wallet, sort, dir, result, side, limit];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const res = await fetchTraderActivity(wallet, {
        sort,
        dir,
        result,
        side,
        limit,
        cursor: pageParam,
      });
      if (pageParam === undefined && isErrorEmptyPage(res)) {
        const cached = queryClient.getQueryData<{ pages?: ActivityPage[] }>(queryKey);
        const first = cached?.pages?.[0];
        if (first && Array.isArray(first.rows) && first.rows.length > 0) return first;
      }
      return res;
    },
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
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
    const unsub = subscribeWalletLive(wallet, ['trades', 'activity'], {
      onBootstrap: (channel, data) => {
        if (channel !== 'trades') return;
        if (
          typeof data !== 'object' ||
          data === null ||
          !Array.isArray((data as { rows?: unknown }).rows)
        )
          return;
        const page = data as ActivityPage;
        if (isErrorEmptyPage(page)) return;
        if (page.rows.length === 0) {
          const cached = queryClient.getQueryData<{ pages?: ActivityPage[] }>(queryKey);
          const first = cached?.pages?.[0];
          if (first && Array.isArray(first.rows) && first.rows.length > 0) return;
        }
        queryClient.setQueryData<{ pages: ActivityPage[]; pageParams: unknown[] }>(queryKey, {
          pages: [page],
          pageParams: [undefined],
        });
      },
      onActivity: (trade) => {
        queryClient.setQueryData<{ pages: ActivityPage[]; pageParams: unknown[] }>(
          queryKey,
          (old) => {
            if (!old) return old;
            const pages = old.pages.slice();
            if (pages.length === 0) return old;
            pages[0] = { ...pages[0], rows: [trade, ...pages[0].rows] };
            return { ...old, pages };
          },
        );
      },
      onFunding: (funding) => {
        queryClient.setQueryData<{ pages: ActivityPage[]; pageParams: unknown[] }>(
          queryKey,
          (old) => {
            if (!old) return old;
            const pages = old.pages.map((page) => ({
              ...page,
              rows: page.rows.map((row) =>
                row.market === funding.coin &&
                row.opened_at <= funding.time &&
                funding.time <= row.closed_at
                  ? { ...row, funding: row.funding + funding.usdc }
                  : row,
              ),
            }));
            return { ...old, pages };
          },
        );
      },
      onStatus: (status) => {
        setLive(status);
        setWsLive(status === 'connected');
      },
      onConnection: (status) => setConnection(status),
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, enabled, queryClient, sort, dir, result, side, limit]);

  const pages = query.data?.pages ?? [];
  const trades = pages.flatMap((page) => page?.rows ?? []);
  const counts = pages.length > 0 ? (pages[0]?.counts ?? EMPTY_COUNTS) : null;
  const first = pages[0];
  const dataStatus: LiveDataStatus = first?.data_status ?? 'ready';
  const asOf = first?.as_of ?? null;
  const partial = first?.partial ?? false;

  return {
    trades,
    counts,
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
    dataStatus,
    asOf,
    partial,
    live,
    connection,
  };
}
