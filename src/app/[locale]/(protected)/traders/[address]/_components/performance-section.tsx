'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTraderPerformance } from '@/hooks/use-trader-performance';
import { type PortfolioMode, type TraderPeriod } from '@/types/trader';
import { PortfolioChart } from './portfolio-chart';

export interface PerformanceSectionProps {
  walletAddress: string;
  enabled?: boolean;
  period: TraderPeriod;
  onPeriodChange: (p: TraderPeriod) => void;
  seriesOnly?: boolean;
}

export function PerformanceSection({
  walletAddress,
  enabled = true,
  period,
  seriesOnly = true,
}: PerformanceSectionProps) {
  const t = useTranslations('traders');
  const [mode, setMode] = useState<PortfolioMode>('perps');
  const { performance, isLoading, error, refetch } = useTraderPerformance(walletAddress, {
    period,
    mode,
    seriesOnly,
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

  return (
    <section aria-label={t('tabPerformance')} className="flex flex-col gap-3">
      {enabled && (
        <PortfolioChart
          series={performance?.series}
          mode={performance?.mode ?? mode}
          onModeChange={setMode}
          isLoading={isLoading}
        />
      )}
    </section>
  );
}
