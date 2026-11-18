'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTraderOverview, fetchTraderOverviewSeries } from '@/services/traders';
import { shouldRetryTraderQuery, traderRetryDelay } from '@/lib/trader-retry';
import {
  DEFAULT_TRADER_PERIOD,
  DEFAULT_VENUE,
  type TraderOverview,
  type TraderOverviewSeries,
  type TraderPeriod,
} from '@/types/trader';

export interface TraderOverviewParams {
  venue?: string;
  period?: TraderPeriod | string;
  seriesDays?: number;
  pnlMetric?: string;
  pnl_metric?: string;
  enabled?: boolean;
}

export interface UseTraderOverviewOptions extends TraderOverviewParams {
  enabled?: boolean;
}

export interface UseTraderOverviewResult {
  data: TraderOverview | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

function normalize(
  params?: TraderOverviewParams | string,
  period?: TraderPeriod | string,
  seriesDays?: number,
  enabled?: boolean,
  pnlMetric?: string,
) {
  if (typeof params === 'string') {
    return {
      venue: params,
      period: period ?? DEFAULT_TRADER_PERIOD,
      seriesDays: seriesDays ?? 30,
      pnlMetric: pnlMetric,
      enabled: enabled ?? true,
    };
  }
  return {
    venue: params?.venue ?? DEFAULT_VENUE,
    period: params?.period ?? DEFAULT_TRADER_PERIOD,
    seriesDays: params?.seriesDays ?? 30,
    pnlMetric: params?.pnlMetric ?? params?.pnl_metric ?? pnlMetric,
    enabled: params?.enabled ?? enabled ?? true,
  };
}

export function useTraderOverview(
  params?: TraderOverviewParams | string,
  period?: TraderPeriod | string,
  seriesDays?: number,
  enabled = true,
): UseTraderOverviewResult {
  const {
    venue,
    period: p,
    seriesDays: d,
    enabled: en,
  } = normalize(params, period, seriesDays, enabled);

  const query = useQuery({
    queryKey: ['trader-overview', venue, p, d],
    queryFn: () => fetchTraderOverview({ venue, period: String(p), seriesDays: d }),
    enabled: en,
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

export interface UseTraderOverviewSeriesResult {
  data: TraderOverviewSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useTraderOverviewSeries(
  params?: TraderOverviewParams | string,
  period?: TraderPeriod | string,
  seriesDays?: number,
  enabled = true,
  pnlMetric?: string,
): UseTraderOverviewSeriesResult {
  const {
    venue,
    period: p,
    seriesDays: d,
    pnlMetric: pm,
    enabled: en,
  } = normalize(params, period, seriesDays, enabled, pnlMetric);

  const query = useQuery({
    queryKey: ['trader-overview-series', venue, p, pm ?? 'realized_pnl', d],
    queryFn: () =>
      fetchTraderOverviewSeries({
        venue,
        period: String(p),
        ...(pm ? { pnlMetric: pm } : {}),
        seriesDays: d,
      }),
    enabled: en,
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

// Re-export for convenience
export type { TraderOverview };
export type { TraderOverviewSeries };
