'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderPositions } from '@/services/traders';
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

export function useTraderPositions(
  walletAddress: string,
  options: TraderPositionsOptions = {},
): UseTraderPositionsResult {
  const wallet = walletAddress.toLowerCase();
  const sort = options.sort ?? DEFAULT_POSITION_SORT;
  const dir = options.dir ?? DEFAULT_POSITION_DIR;
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-positions', wallet, sort, dir],
    queryFn: () => fetchTraderPositions(wallet, { sort, dir }),
    enabled,
    staleTime: 15_000,
  });

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
