'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  isRefreshing: boolean;
  refreshing: boolean;
  isUpdating: boolean;
  updating: boolean;
  zeroCount: number;
  zeroCounter: number;
}

export function hasPositionData(snapshot: PositionSnapshot | null | undefined): boolean {
  if (!snapshot) return false;
  if (Array.isArray(snapshot.positions) && snapshot.positions.length > 0) return true;
  const accountValue = snapshot.summary?.account_value ?? null;
  return typeof accountValue === 'number' && accountValue > 0;
}

export function isEmptyPositionSnapshot(snapshot: PositionSnapshot | null | undefined): boolean {
  if (!snapshot) return true;
  const hasPositions = Array.isArray(snapshot.positions) && snapshot.positions.length > 0;
  const accountValue = snapshot.summary?.account_value ?? null;
  const hasAccount = typeof accountValue === 'number' && accountValue > 0;
  return !hasPositions && !hasAccount;
}

export function comparePositionAsOf(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (!a || !b) return null;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  if (ta < tb) return -1;
  if (ta === tb) return 0;
  return 1;
}

export interface PositionSnapshotDecision {
  ignore: boolean;
  zeroCount: number;
  refreshing: boolean;
  reason: 'error' | 'stale-empty' | 'zero-first' | 'zero-confirmed' | 'apply';
}

export function decidePositionSnapshot(
  current: PositionSnapshot | null | undefined,
  incoming: PositionSnapshot,
  zeroCount: number = 0,
): PositionSnapshotDecision {
  const currentHasData = hasPositionData(current);

  if (incoming.data_status === 'error' && current?.data_status === 'ready' && currentHasData) {
    return { ignore: true, zeroCount, refreshing: false, reason: 'error' };
  }

  if (isEmptyPositionSnapshot(incoming) && currentHasData) {
    const cmp = comparePositionAsOf(incoming.as_of, current?.as_of);
    if (cmp !== null && cmp <= 0) {
      return { ignore: true, zeroCount, refreshing: false, reason: 'stale-empty' };
    }
    const nextZeroCount = zeroCount + 1;
    if (nextZeroCount < 2) {
      return {
        ignore: true,
        zeroCount: nextZeroCount,
        refreshing: true,
        reason: 'zero-first',
      };
    }
    return {
      ignore: false,
      zeroCount: nextZeroCount,
      refreshing: false,
      reason: 'zero-confirmed',
    };
  }

  return { ignore: false, zeroCount: 0, refreshing: false, reason: 'apply' };
}

export function shouldApplyPositionSnapshot(
  current: PositionSnapshot | null | undefined,
  incoming: PositionSnapshot,
  zeroCount: number = 0,
): boolean {
  return !decidePositionSnapshot(current, incoming, zeroCount).ignore;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zeroCount, setZeroCount] = useState(0);

  const zeroCountRef = useRef(0);
  const manualRefetchRef = useRef(false);

  const query = useQuery({
    queryKey: ['trader-positions', wallet, sort, dir],
    queryFn: async () => {
      const incoming = await fetchTraderPositions(wallet, { sort, dir });
      const key = ['trader-positions', wallet, sort, dir];

      if (manualRefetchRef.current) {
        manualRefetchRef.current = false;
        zeroCountRef.current = 0;
        setZeroCount(0);
        setIsRefreshing(false);
        return incoming;
      }

      const current = queryClient.getQueryData<PositionSnapshot>(key);
      const decision = decidePositionSnapshot(current, incoming, zeroCountRef.current);
      zeroCountRef.current = decision.zeroCount;
      setZeroCount(decision.zeroCount);
      setIsRefreshing(decision.refreshing);

      if (decision.ignore) {
        return current ?? incoming;
      }
      return incoming;
    },
    enabled,
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 30_000,
    placeholderData: (previousData, previousQuery) => {
      const prevKey = previousQuery?.queryKey as unknown[] | undefined;
      const prevWallet = Array.isArray(prevKey) && prevKey.length > 1 ? prevKey[1] : undefined;
      if (prevWallet !== wallet) return undefined;
      return previousData as PositionSnapshot | undefined;
    },
    refetchInterval: (q) => {
      if (q.state.status === 'error') return false;
      return wsLive ? 0 : 60_000;
    },
  });

  useEffect(() => {
    zeroCountRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZeroCount(0);

    setIsRefreshing(false);
    setIsRefreshing(false);
  }, [wallet, sort, dir]);

  useEffect(() => {
    if (!wallet) return;
    const unsub = subscribeWalletLive(wallet, ['positions'], {
      onBootstrap: (channel, data) => {
        if (channel !== 'positions') return;
        const snapshot = data as PositionSnapshot;
        const key = ['trader-positions', wallet, sort, dir];
        const current = queryClient.getQueryData<PositionSnapshot>(key);
        const decision = decidePositionSnapshot(current, snapshot, zeroCountRef.current);
        zeroCountRef.current = decision.zeroCount;
        setZeroCount(decision.zeroCount);
        setIsRefreshing(decision.refreshing);

        if (decision.ignore) return;

        const sorted = sortPositionsClient(snapshot.positions, sort, dir);
        queryClient.setQueryData<PositionSnapshot>(key, {
          ...snapshot,
          positions: sorted,
        });
      },
      onPosition: (snapshot) => {
        const key = ['trader-positions', wallet, sort, dir];
        const current = queryClient.getQueryData<PositionSnapshot>(key);
        const decision = decidePositionSnapshot(current, snapshot, zeroCountRef.current);
        zeroCountRef.current = decision.zeroCount;
        setZeroCount(decision.zeroCount);
        setIsRefreshing(decision.refreshing);

        if (decision.ignore) return;

        const sorted = sortPositionsClient(snapshot.positions, sort, dir);
        queryClient.setQueryData<PositionSnapshot>(key, {
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
      manualRefetchRef.current = true;
      void query.refetch();
    },
    live: wsLive ? 'connected' : 'disconnected',
    isRefreshing,
    refreshing: isRefreshing,
    isUpdating: isRefreshing,
    updating: isRefreshing,
    zeroCount,
    zeroCounter: zeroCount,
  };
}
