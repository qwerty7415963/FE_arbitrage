'use client';

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
import { formatSignedPercent, formatSignedUsd, formatUsd } from '@/lib/trader-format';
import { useTraderPerformance } from '@/hooks/use-trader-performance';
import { type TraderPeriod } from '@/types/trader';

export interface PerformanceSectionProps {
  walletAddress: string;
  enabled?: boolean;
  period: TraderPeriod;
  onPeriodChange: (p: TraderPeriod) => void;
}

export function PerformanceSection({
  walletAddress,
  enabled = true,
  period,
}: PerformanceSectionProps) {
  const t = useTranslations('traders');
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
      {metrics && (
        <p className="text-sm font-medium">
          {t('pnl')}:{' '}
          {metrics.pnl === null || metrics.pnl === undefined ? '—' : formatSignedUsd(metrics.pnl)}
        </p>
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
