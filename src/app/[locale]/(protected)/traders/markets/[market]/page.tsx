'use client';

import { Suspense, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketHeader } from './_components/market-header';
import { MarketSnapshotRibbon } from './_components/market-snapshot-ribbon';
import { MarketWalletTable } from './_components/market-wallet-table';
import { useMarketDetail } from '@/hooks/use-market-detail';

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function MarketDetailPage() {
  return (
    <Suspense>
      <MarketDetailContent />
    </Suspense>
  );
}

function MarketDetailContent() {
  const params = useParams<{ locale: string; market: string }>();
  const searchParams = useSearchParams();
  const t = useTranslations('traders');

  const market = params.market ? decodeURIComponent(params.market) : '';
  const venue = searchParams.get('venue') ?? 'hyperliquid';

  const defaults = useMemo(() => defaultRange(), []);
  const from = searchParams.get('from') ?? defaults.from;
  const to = searchParams.get('to') ?? defaults.to;

  const detail = useMarketDetail(market, { venue, from, to });

  if (detail.isLoading && !detail.data) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label={t('loading')}>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-destructive text-sm">{t('marketDetail.error')}</p>
        <button
          type="button"
          className="border-input bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
          onClick={() => detail.refetch()}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="market-detail-page" className="flex flex-col gap-4">
      <nav className="text-sm">
        <Link href="/traders" className="text-muted-foreground hover:text-foreground">
          ← {t('title')}
        </Link>
        <span className="text-muted-foreground"> / {market}</span>
      </nav>
      <MarketHeader header={detail.data?.header ?? null} market={market} venue={venue} />
      <MarketSnapshotRibbon snapshot={detail.data?.snapshot ?? null} />
      <MarketWalletTable market={market} venue={venue} from={from} to={to} />
    </div>
  );
}
