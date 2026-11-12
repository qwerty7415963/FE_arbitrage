'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBucketMarkets } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  DEFAULT_TRADER_PERIOD,
  DEFAULT_VENUE,
  type BucketKind,
  type BucketMarketRow,
  type BucketRange,
  type TraderPeriod,
} from '@/types/trader';
import type { Meta } from '@/types/api';

export interface BucketMarketsParams {
  kind?: BucketKind | string;
  bucket?: string;
  id?: string;
  bucketId?: string;
  venue?: string;
  period?: TraderPeriod | string;
  range?: BucketRange | string;
  search?: string;
  sort?: string;
  dir?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

function normalize(args: unknown[]) {
  if (typeof args[0] === 'string') {
    const p = args[6] && typeof args[6] === 'object' ? args[6] : {};
    return {
      kind: args[0],
      bucket: args[1],
      venue: args[2] ?? DEFAULT_VENUE,
      period: args[3] ?? DEFAULT_TRADER_PERIOD,
      range: args[4] ?? '30D',
      search: args[5] ?? '',
      sort: 'notional',
      dir: 'desc',
      page: 1,
      limit: 20,
      enabled: true,
      ...p,
    };
  }
  const p = (args[0] ?? {}) as BucketMarketsParams;
  return {
    kind: p.kind ?? '',
    bucket: p.bucket ?? p.id ?? p.bucketId ?? '',
    venue: p.venue ?? DEFAULT_VENUE,
    period: p.period ?? DEFAULT_TRADER_PERIOD,
    range: p.range ?? '30D',
    search: p.search ?? '',
    sort: p.sort ?? 'notional',
    dir: p.dir ?? 'desc',
    page: p.page ?? 1,
    limit: p.limit ?? 20,
    enabled: p.enabled ?? true,
  };
}

export interface UseBucketMarketsResult {
  data: { data: BucketMarketRow[]; meta: Meta } | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useBucketMarkets(...args: unknown[]): UseBucketMarketsResult {
  const { kind, bucket, venue, period, range, search, sort, dir, page, limit, enabled } =
    normalize(args);
  const query = useQuery({
    queryKey: [
      'bucket-markets',
      kind,
      bucket,
      venue,
      period,
      range,
      search,
      sort,
      dir,
      page,
      limit,
    ],
    queryFn: () =>
      fetchBucketMarkets({
        kind,
        bucket,
        venue,
        period,
        range,
        search,
        sort,
        dir,
        page,
        limit,
      } as Record<string, unknown>),
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
