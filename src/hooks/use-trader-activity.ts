'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTraderActivity } from '@/services/traders';
import { connectTradeActivityWS, type ActivityWsStatus } from '@/lib/trader-activity-ws';
import type { ActivityFill, ActivityTrade } from '@/types/trader';

export interface UseTraderActivityResult {
  trades: ActivityTrade[];
  liveFills: ActivityFill[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  refetch: () => void;
  hasMore: boolean;
  live: ActivityWsStatus;
}

const LIVE_FILLS_MAX = 50;

export function useTraderActivity(walletAddress: string): UseTraderActivityResult {
  const wallet = walletAddress.toLowerCase();
  const [liveFills, setLiveFills] = useState<ActivityFill[]>([]);
  const [live, setLive] = useState<ActivityWsStatus>('disconnected');

  const query = useInfiniteQuery({
    queryKey: ['trader-activity', wallet],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchTraderActivity(wallet, { cursor: pageParam }),
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: wallet.length > 0,
  });

  useEffect(() => {
    if (!wallet) return;
    const handle = connectTradeActivityWS(
      wallet,
      (fill) => {
        setLiveFills((prev) => [fill, ...prev].slice(0, LIVE_FILLS_MAX));
      },
      (status) => setLive(status),
    );
    return () => handle.close();
  }, [wallet]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisible = () => {
      if (!document.hidden) {
        void query.refetch();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const trades = (query.data?.pages ?? []).flatMap((page) => page?.rows ?? []);

  return {
    trades,
    liveFills,
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
  };
}
