'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatRelativeTime,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import { useTraderPerformance } from '@/hooks/use-trader-performance';
import { TRADER_PERIODS, type TraderPeriod } from '@/types/trader';

export interface PerformanceSectionProps {
  walletAddress: string;
  enabled?: boolean;
}

export function PerformanceSection({ walletAddress, enabled = true }: PerformanceSectionProps) {
  const t = useTranslations('traders');
  const [period, setPeriod] = useState<TraderPeriod>('30D');
  const { performance, isLoading, error, refetch } = useTraderPerformance(walletAddress, {
    period,
    enabled,
  });

  if (isLoading && !performance) {
    return (
      <section aria-label={t('tabPerformance')} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && !performance) {
    return (
      <section aria-label={t('tabPerformance')} className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  const metrics = performance?.metrics ?? null;
  const equity = performance?.equity ?? [];

  return (
    <section aria-label={t('tabPerformance')} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1" role="group" aria-label={t('period')}>
        {TRADER_PERIODS.map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {metrics && (
        <p className="text-muted-foreground text-xs">
          {t(metrics.data_status === 'error' ? 'statusError' : 'statusReady')}
          {metrics.metrics_as_of &&
            ` · ${t('metricsAsOf', { time: formatRelativeTime(metrics.metrics_as_of) ?? '' })}`}
          {metrics.is_partial && ` · ${t('partialData')}`}
        </p>
      )}

      {metrics && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('roi')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatSignedPercent(metrics.roi) ?? '—'}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('pnl')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {metrics.pnl === null || metrics.pnl === undefined
                ? '—'
                : formatSignedUsd(metrics.pnl)}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('winRate')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatPercent(metrics.win_rate) ?? '—'}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('volume')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatUsd(metrics.volume) ?? '—'}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('tradeCount')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatInteger(metrics.trade_count) ?? '—'}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('profitFactor')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatDecimal(metrics.profit_factor) ?? '—'}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground text-xs">{t('maxDrawdown')}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatDecimal(metrics.max_drawdown_pct) ?? '—'}
            </dd>
          </div>
        </dl>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t('equityTitle')}</h3>
        {equity.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noEquity')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colDate')}</TableHead>
                  <TableHead className="text-right">{t('colEndEquity')}</TableHead>
                  <TableHead className="text-right">{t('colDailyReturn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equity.map((point) => (
                  <TableRow key={point.date}>
                    <TableCell className="font-medium">{point.date}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUsd(point.end_equity) ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatSignedPercent(point.daily_return) ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
