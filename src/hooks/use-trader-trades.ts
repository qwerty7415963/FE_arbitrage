'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTraderActivity } from '@/services/traders';
import { connectTradeActivityWS, type ActivityWsStatus } from '@/lib/trader-activity-ws';
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
  /** Live signal (contract v1.2 §1.2): ready|error only. */
  dataStatus: LiveDataStatus;
  asOf: string | null;
  partial: boolean;
  live: ActivityWsStatus;
  connection: WalletConnectionStatus | null;
}

const EMPTY_COUNTS: ActivityCounts = { win: 0, loss: 0, long: 0, short: 0, total: 0 };

/**
 * Live trades (contract v1.2 §1.2 + §2): same 30d fills → reconstruct source
 * as activity; `funding` is informational (`net_pnl = pnl − fees` unchanged).
 * WS `wallet.activity.created` prepends rows and `wallet.funding.created`
 * attributes funding incrementally — never a full refetch.
 */
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
  const [live, setLive] = useState<ActivityWsStatus>('disconnected');
  const [connection, setConnection] = useState<WalletConnectionStatus | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ['trader-trades', wallet, sort, dir, result, side, limit];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchTraderActivity(wallet, { sort, dir, result, side, limit, cursor: pageParam }),
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!wallet || !enabled) return;
    const handle = connectTradeActivityWS(
      wallet,
      () => {},
      (status) => setLive(status),
      {
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
        onConnection: (status) => setConnection(status),
      },
    );
    return () => handle.close();
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
