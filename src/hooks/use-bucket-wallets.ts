'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBucketWallets } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  DEFAULT_TRADER_PERIOD,
  DEFAULT_VENUE,
  type BucketKind,
  type BucketWalletRow,
  type TraderPeriod,
} from '@/types/trader';
import type { Meta } from '@/types/api';

export interface BucketWalletsParams {
  kind?: BucketKind | string;
  bucket?: string;
  id?: string;
  bucketId?: string;
  venue?: string;
  period?: TraderPeriod | string;
  sort?: string;
  dir?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

function normalize(args: unknown[]) {
  if (typeof args[0] === 'string') {
    const p = args[5] && typeof args[5] === 'object' ? args[5] : {};
    return {
      kind: args[0],
      bucket: args[1],
      venue: args[2] ?? DEFAULT_VENUE,
      period: args[3] ?? DEFAULT_TRADER_PERIOD,
      sort: args[4] ?? 'equity',
      dir: 'desc',
      page: 1,
      limit: 20,
      enabled: true,
      ...p,
    };
  }
  const p = (args[0] ?? {}) as BucketWalletsParams;
  return {
    kind: p.kind ?? '',
    bucket: p.bucket ?? p.id ?? p.bucketId ?? '',
    venue: p.venue ?? DEFAULT_VENUE,
    period: p.period ?? DEFAULT_TRADER_PERIOD,
    sort: p.sort ?? 'equity',
    dir: p.dir ?? 'desc',
    page: p.page ?? 1,
    limit: p.limit ?? 20,
    enabled: p.enabled ?? true,
  };
}

export interface UseBucketWalletsResult {
  data: { data: BucketWalletRow[]; meta: Meta } | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useBucketWallets(...args: unknown[]): UseBucketWalletsResult {
  const { kind, bucket, venue, period, sort, dir, page, limit, enabled } = normalize(args);
  const query = useQuery({
    queryKey: ['bucket-wallets', kind, bucket, venue, period, sort, dir, page, limit],
    queryFn: () =>
      fetchBucketWallets({ kind, bucket, venue, period, sort, dir, page, limit } as Record<
        string,
        unknown
      >),
    enabled: Boolean(enabled && kind && bucket),
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: () => {
      void query.refetch();
    },
  };
}
