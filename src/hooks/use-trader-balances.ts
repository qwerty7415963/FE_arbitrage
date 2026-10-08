'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderBalances } from '@/services/traders';
import type { BalancesSnapshot } from '@/types/trader';

export interface UseTraderBalancesResult {
  balances: BalancesSnapshot | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useTraderBalances(
  walletAddress: string,
  options: { enabled?: boolean } = {},
): UseTraderBalancesResult {
  const wallet = walletAddress.toLowerCase();
  const enabled = (options.enabled ?? true) && wallet.length > 0;

  const query = useQuery({
    queryKey: ['trader-balances', wallet],
    queryFn: () => fetchTraderBalances(wallet),
    enabled,
    staleTime: 15_000,
  });

  return {
    balances: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
