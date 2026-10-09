'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTraderPositions } from '@/services/traders';
import { connectTradeActivityWS } from '@/lib/trader-activity-ws';
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
}

/**
 * Live positions (contract v1.2 §1.1 + §2): REST `clearinghouseState`
 * (short TTL, no WS stream for ticks). `wallet.position.updated` (sent on
 * REST bootstrap/resync only) patches the cache incrementally — never a
 * full refetch, never sync polling.
 */
export function useTraderPositions(
  walletAddress: string,
  options: TraderPositionsOptions = {},
): UseTraderPositionsResult {
  const wallet = walletAddress.toLowerCase();
  const sort = options.sort ?? DEFAULT_POSITION_SORT;
  const dir = options.dir ?? DEFAULT_POSITION_DIR;
  const enabled = (options.enabled ?? true) && wallet.length > 0;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trader-positions', wallet, sort, dir],
    queryFn: () => fetchTraderPositions(wallet, { sort, dir }),
    enabled,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!wallet) return;
    const handle = connectTradeActivityWS(wallet, () => {}, undefined, {
      onPosition: (snapshot) => {
        queryClient.setQueryData<PositionSnapshot>(
          ['trader-positions', wallet, sort, dir],
          snapshot,
        );
      },
    });
    return () => handle.close();
  }, [wallet, sort, dir, queryClient]);

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
