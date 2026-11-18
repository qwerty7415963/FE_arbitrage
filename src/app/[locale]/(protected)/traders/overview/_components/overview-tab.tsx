'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboardIcon } from 'lucide-react';
import {
  DEFAULT_TRADER_PERIOD,
  TRADER_PERIODS,
  type TraderOverview,
  type TraderOverviewSeries,
  type TraderPeriod,
} from '@/types/trader';
import { OverviewCard } from './overview-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';

export interface OverviewTabProps {
  venue?: string;
  period?: TraderPeriod | string;
  onPeriodChange?: (period: TraderPeriod) => void;
  seriesDays?: number;
  data?: TraderOverview;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  onRetry?: () => void;
  refetch?: () => void;
  pnlIcon?: LucideIcon;
  accountIcon?: LucideIcon;
  seriesData?: TraderOverviewSeries;
  series?: TraderOverviewSeries;
  overviewSeries?: TraderOverviewSeries;
  seriesLoading?: boolean;
  isSeriesLoading?: boolean;
  isLoadingSeries?: boolean;
  seriesIsLoading?: boolean;
  seriesPending?: boolean;
}

export function OverviewTab(props: OverviewTabProps) {
  const t = useTranslations('traders.overview');
  const [internalPeriod, setInternalPeriod] = useState<TraderPeriod>(
    (props.period as TraderPeriod) ?? DEFAULT_TRADER_PERIOD,
  );
  const period = (props.period as TraderPeriod) ?? internalPeriod;

  const data = props.data;
  const isLoading = props.isLoading ?? false;
  const isError = props.isError ?? false;
  const refetch = props.refetch;

  const seriesData = props.seriesData ?? props.series ?? props.overviewSeries;
  const seriesLoading =
    props.seriesLoading ??
    props.isSeriesLoading ??
    props.isLoadingSeries ??
    props.seriesIsLoading ??
    props.seriesPending ??
    false;

  function bucketSeries(bucketId: string, kind: 'pnl' | 'account'): { t: string; v: number }[] {
    if (!seriesData) return [];
    const rows = kind === 'account' ? seriesData.account_series : seriesData.pnl_series;
    return (rows ?? [])
      .filter((r) => r.bucket === bucketId)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((r) => ({ t: r.date, v: r.pnl }));
  }

  const handlePeriodChange = (p: TraderPeriod) => {
    if (props.onPeriodChange) props.onPeriodChange(p);
    else setInternalPeriod(p);
  };

  const TrendingIcon = props.pnlIcon;
  const WalletIcon = props.accountIcon;

  if (isLoading) {
    return (
      <div
        className="flex flex-1 flex-col gap-4 p-4 lg:p-6"
        role="status"
        aria-label={t('loading')}
      >
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center gap-3 p-4 lg:p-6">
        <p className="text-destructive text-sm">{t('error')}</p>
        <button
          type="button"
          className="border-input bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
          onClick={() => (props.onRetry ? props.onRetry() : refetch?.())}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const pnlBuckets = data?.pnl_buckets ?? [];
  const accountBuckets = data?.account_buckets ?? [];
  const empty = !data || (pnlBuckets.length === 0 && accountBuckets.length === 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <div className="flex items-center gap-2" role="group" aria-label={t('period')}>
        {TRADER_PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => handlePeriodChange(p)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              period === p ? 'bg-primary text-primary-foreground' : 'bg-background'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">{t('sections.performance')}</h2>
            {pnlBuckets.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noPnlWallets')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pnlBuckets.map((b) => (
                  <OverviewCard
                    key={b.id}
                    bucket={b}
                    icon={TrendingIcon ?? LayoutDashboardIcon}
                    kind="pnl"
                    title={t(`bucketLabels.${b.id}` as never)}
                    subtitle={t(`thresholds.${b.id}` as never)}
                    sentiment={b.sentiment}
                    series={seriesData ? bucketSeries(b.id, 'pnl') : b.series}
                    seriesLoading={seriesLoading}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">{t('sections.accountSize')}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accountBuckets.map((b) => (
                <OverviewCard
                  key={b.id}
                  bucket={b}
                  icon={WalletIcon ?? LayoutDashboardIcon}
                  kind="account"
                  title={t(`bucketLabels.${b.id}` as never)}
                  subtitle={t(`thresholds.${b.id}` as never)}
                  sentiment={b.sentiment}
                  series={seriesData ? bucketSeries(b.id, 'account') : b.series}
                  seriesLoading={seriesLoading}
                />
              ))}
            </div>
          </section>

          <footer className="text-muted-foreground border-t pt-3 text-xs">
            <span className="font-medium">{t('coverage.title')}</span> {t('coverage.pnlWallets')}:{' '}
            {data?.coverage?.pnl_wallets ?? 0} · {t('coverage.accountValueWallets')}:{' '}
            {data?.coverage?.account_value_wallets ?? 0} · {t('coverage.seriesWallets')}:{' '}
            {data?.coverage?.series_wallets ?? 0} · {t('coverage.ready')}:{' '}
            {data?.coverage?.data_status?.ready ?? 0} {t('coverage.stale')}:{' '}
            {data?.coverage?.data_status?.stale ?? 0} {t('coverage.error')}:{' '}
            {data?.coverage?.data_status?.error ?? 0} {t('coverage.syncing')}:{' '}
            {data?.coverage?.data_status?.syncing ?? 0}
          </footer>
        </>
      )}
    </div>
  );
}

export const OverviewPage = OverviewTab;
export const TraderOverviewPage = OverviewTab;
export const OverviewContent = OverviewTab;
