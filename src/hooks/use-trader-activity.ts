'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTraderActivity } from '@/services/traders';
import { connectTradeActivityWS, type ActivityWsStatus } from '@/lib/trader-activity-ws';
import { traderDataRefetchInterval } from '@/lib/trader-poll';
import type {
  ActivityFill,
  ActivityPage,
  ActivityTrade,
  LiveDataStatus,
  WalletConnectionStatus,
  WalletFundingEvent,
} from '@/types/trader';

export interface UseTraderActivityResult {
  trades: ActivityTrade[];
  liveFills: ActivityFill[];
  liveFundings: WalletFundingEvent[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  refetch: () => void;
  hasMore: boolean;
  live: ActivityWsStatus;
  /** Backend reconnect state (`wallet.connection.updated`); null until first event. */
  connection: WalletConnectionStatus | null;
  /** Live signal (contract v1.2 §1.2): ready|error only. */
  dataStatus: LiveDataStatus;
  asOf: string | null;
  partial: boolean;
}

const LIVE_FILLS_MAX = 50;
const LIVE_FUNDINGS_MAX = 50;

/**
 * Live activity (contract v1.2 §1.2 + §2): REST `userFillsByTime` 30d +
 * `wallet.*` incremental updates. Mounted feed polls every 30s
 * (`traderDataRefetchInterval`); error stops polling and needs a manual retry.
 */
export function useTraderActivity(walletAddress: string): UseTraderActivityResult {
  const wallet = walletAddress.toLowerCase();
  const [liveFills, setLiveFills] = useState<ActivityFill[]>([]);
  const [liveFundings, setLiveFundings] = useState<WalletFundingEvent[]>([]);
  const [live, setLive] = useState<ActivityWsStatus>('disconnected');
  const [connection, setConnection] = useState<WalletConnectionStatus | null>(null);
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['trader-activity', wallet],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchTraderActivity(wallet, { cursor: pageParam }),
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: wallet.length > 0,
    // Fail fast to error UI; recovery is manual retry or 30s poll, not hidden retries.
    retry: false,
    refetchInterval: traderDataRefetchInterval,
  });

  useEffect(() => {
    if (!wallet) return;
    const handle = connectTradeActivityWS(
      wallet,
      (fill) => {
        setLiveFills((prev) => [fill, ...prev].slice(0, LIVE_FILLS_MAX));
      },
      (status) => setLive(status),
      {
        onFunding: (funding) => {
          setLiveFundings((prev) => [funding, ...prev].slice(0, LIVE_FUNDINGS_MAX));
        },
        onActivity: (trade) => {
          queryClient.setQueryData<{ pages: ActivityPage[]; pageParams: unknown[] }>(
            ['trader-activity', wallet],
            (old) => {
              if (!old) return old;
              const pages = old.pages.slice();
              if (pages.length === 0) return old;
              pages[0] = { ...pages[0], rows: [trade, ...pages[0].rows] };
              return { ...old, pages };
            },
          );
        },
        onConnection: (status) => setConnection(status),
      },
    );
    return () => handle.close();
  }, [wallet, queryClient]);

  const pages = query.data?.pages ?? [];
  const trades = pages.flatMap((page) => page?.rows ?? []);
  const first = pages[0];
  const dataStatus: LiveDataStatus = first?.data_status ?? 'ready';
  const asOf = first?.as_of ?? null;
  const partial = first?.partial ?? false;

  return {
    trades,
    liveFills,
    liveFundings,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    refetch: () => {
      void query.refetch();
    },
    hasMore: query.hasNextPage ?? false,
    live,
    connection,
    dataStatus,
    asOf,
    partial,
  };
}
