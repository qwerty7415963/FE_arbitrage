'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { DEFAULT_TRADER_PERIOD, TRADER_PERIODS, type TraderPeriod } from '@/types/trader';
import { useTraderOverview, useTraderOverviewSeries } from '@/hooks/use-trader-overview';
import { OverviewTab } from './_components/overview-tab';

export default function TradersOverviewPage() {
  return (
    <Suspense>
      <OverviewContent />
    </Suspense>
  );
}

function OverviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const rawPeriod = searchParams.get('period');
  const initialPeriod =
    rawPeriod && (TRADER_PERIODS as string[]).includes(rawPeriod)
      ? (rawPeriod as TraderPeriod)
      : DEFAULT_TRADER_PERIOD;
  const [period, setPeriod] = useState<TraderPeriod>(initialPeriod);

  const { data, isLoading, isError, refetch } = useTraderOverview({
    venue: 'hyperliquid',
    period,
    seriesDays: 30,
  });

  const { data: seriesData, isLoading: isSeriesLoading } = useTraderOverviewSeries({
    venue: 'hyperliquid',
    period,
    seriesDays: 30,
    enabled: !isLoading && !!data,
  });

  const handlePeriodChange = (p: TraderPeriod) => {
    setPeriod(p);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('period', p);
    router.replace(`/${locale}/traders/overview?${sp.toString()}`, { scroll: false });
  };

  return (
    <OverviewTab
      venue="hyperliquid"
      period={period}
      onPeriodChange={handlePeriodChange}
      seriesDays={30}
      data={data}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      seriesData={seriesData}
      seriesLoading={isSeriesLoading}
    />
  );
}
