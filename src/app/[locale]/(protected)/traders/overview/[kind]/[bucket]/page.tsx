'use client';

import { Suspense, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { BucketHeader } from './_components/bucket-header';
import { BucketStatBars } from './_components/bucket-stat-bars';
import { BucketPositioningChart } from './_components/bucket-positioning-chart';
import { BucketTreemap } from './_components/bucket-treemap';
import { BucketTables } from './_components/bucket-tables';
import { useBucketDetail } from '@/hooks/use-bucket-detail';
import { type BucketKind, type BucketRange, type TraderPeriod } from '@/types/trader';

const BUCKET_RANGES: BucketRange[] = ['24H', '7D', '30D'];

export default function BucketDetailPage() {
  return (
    <Suspense>
      <BucketDetailContent />
    </Suspense>
  );
}

function BucketDetailContent() {
  const params = useParams<{ locale: string; kind: string; bucket: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('traders.bucketDetail');
  const kind = params.kind ?? '';
  const bucket = params.bucket ?? '';
  const isValidKind = kind === 'pnl' || kind === 'account';
  const isValid = isValidKind && bucket.trim() !== '';

  const rawRange = searchParams.get('range');
  const initialRange =
    rawRange && (BUCKET_RANGES as string[]).includes(rawRange)
      ? (rawRange as BucketRange)
      : ('30D' as BucketRange);

  const [pageRange, setPageRange] = useState<BucketRange>(initialRange);

  const period: TraderPeriod = pageRange === '24H' ? '1D' : pageRange === '7D' ? '7D' : '30D';

  const { data, isLoading, isError, refetch } = useBucketDetail({
    kind: isValidKind ? (kind as BucketKind) : 'pnl',
    bucket,
    venue: 'hyperliquid',
    period,
    range: '30D',
    enabled: isValid,
  });

  const handlePageRangeChange = (r: string) => {
    const nr = r as BucketRange;
    setPageRange(nr);
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', nr);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!isValid) {
    return <div className="text-destructive p-4 text-sm">{t('error')}</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <BucketHeader
        kind={kind}
        bucket={bucket}
        detail={data ?? null}
        backHref="/traders/overview"
        range={pageRange}
        onRangeChange={handlePageRangeChange}
      />

      {isLoading && !data ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-destructive text-sm">{t('error')}</p>
          <button
            type="button"
            className="border-input bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
            onClick={() => refetch()}
          >
            {t('retry')}
          </button>
        </div>
      ) : !data ? (
        <div className="text-muted-foreground text-sm">{t('empty')}</div>
      ) : (
        <>
          <BucketStatBars detail={data} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BucketPositioningChart detail={data} bucket={bucket} />
            <BucketTreemap detail={data} />
          </div>
          <BucketTables
            kind={kind}
            bucket={bucket}
            detail={data}
            venue="hyperliquid"
            period={period}
            range={pageRange}
          />
        </>
      )}
    </div>
  );
}
