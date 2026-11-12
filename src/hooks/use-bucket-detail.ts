'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchBucketDetail } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  DEFAULT_TRADER_PERIOD,
  DEFAULT_VENUE,
  type BucketDetail,
  type BucketKind,
  type BucketRange,
  type TraderPeriod,
} from '@/types/trader';

export interface BucketDetailParams {
  kind?: BucketKind | string;
  bucket?: string;
  id?: string;
  bucketId?: string;
  venue?: string;
  period?: TraderPeriod | string;
  range?: BucketRange | string;
  enabled?: boolean;
}

function normalize(args: unknown[]) {
  if (typeof args[0] === 'string') {
    return {
      kind: args[0],
      bucket: args[1],
      venue: args[2] ?? DEFAULT_VENUE,
      period: args[3] ?? DEFAULT_TRADER_PERIOD,
      range: args[4] ?? '30D',
      enabled: args[5] ?? true,
    };
  }
  const p = (args[0] ?? {}) as BucketDetailParams;
  return {
    kind: p.kind ?? '',
    bucket: p.bucket ?? p.id ?? p.bucketId ?? '',
    venue: p.venue ?? DEFAULT_VENUE,
    period: p.period ?? DEFAULT_TRADER_PERIOD,
    range: p.range ?? '30D',
    enabled: p.enabled ?? true,
  };
}

export interface UseBucketDetailOptions extends BucketDetailParams {
  enabled?: boolean;
}

export interface UseBucketDetailResult {
  data: BucketDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useBucketDetail(...args: unknown[]): UseBucketDetailResult {
  const { kind, bucket, venue, period, range, enabled } = normalize(args);
  const query = useQuery({
    queryKey: ['bucket-detail', kind, bucket, venue, period, range],
    queryFn: () =>
      fetchBucketDetail({ kind, bucket, venue, period, range } as Record<string, unknown>),
    enabled: Boolean(enabled && kind && bucket),
    retry: shouldRetryTraderQuery,
    retryDelay: traderRetryDelay,
    staleTime: 60_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
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
