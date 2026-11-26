'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTraderPositions } from '@/services/traders';
import { sortPositionsClient } from '@/lib/position-sort';
import { subscribeWalletLive } from '@/lib/wallet-live';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  DEFAULT_POSITION_DIR,
  DEFAULT_POSITION_SORT,
  type PositionSnapshot,
  type PositionSortKey,
  type SortDirection,
} from '@/types/trader';

export interface TraderPositionsOptions {
  sort?: PositionSortKey;
  dir?: SortDirection;
  enabled?: boolean;
}

export interface UseTraderPositionsResult {
  snapshot: PositionSnapshot | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  live?: string;
}

export function useTraderPositions(
  walletAddress: string,
  options: TraderPositionsOptions = {},
): UseTraderPositionsResult {
  const wallet = walletAddress.toLowerCase();
  const sort = options.sort ?? DEFAULT_POSITION_SORT;
  const dir = options.dir ?? DEFAULT_POSITION_DIR;
  const enabled = (options.enabled ?? true) && wallet.length > 0;
  const queryClient = useQueryClient();
  const [wsLive, setWsLive] = useState(false);

  const query = useQuery({
    queryKey: ['trader-positions', wallet, sort, dir],
    queryFn: () => fetchTraderPositions(wallet, { sort, dir }),
    enabled,
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchInterval: (q) => {
      if (q.state.status === 'error') return false;
      return wsLive ? 0 : 60_000;
    },
  });

  useEffect(() => {
    if (!wallet) return;
    const unsub = subscribeWalletLive(wallet, ['positions'], {
      onBootstrap: (channel, data) => {
        if (channel !== 'positions') return;
        const snapshot = data as PositionSnapshot;
        const sorted = sortPositionsClient(snapshot.positions, sort, dir);
        queryClient.setQueryData<PositionSnapshot>(['trader-positions', wallet, sort, dir], {
          ...snapshot,
          positions: sorted,
        });
      },
      onPosition: (snapshot) => {
        const sorted = sortPositionsClient(snapshot.positions, sort, dir);
        queryClient.setQueryData<PositionSnapshot>(['trader-positions', wallet, sort, dir], {
          ...snapshot,
          positions: sorted,
        });
      },
      onStatus: (status) => setWsLive(status === 'connected'),
    });
    return unsub;
  }, [wallet, sort, dir, queryClient]);

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    live: wsLive ? 'connected' : 'disconnected',
  };
}
