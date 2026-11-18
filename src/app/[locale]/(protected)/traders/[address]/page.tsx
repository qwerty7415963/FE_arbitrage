import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { isValidWalletAddress } from '@/lib/trader-validation';
import { DEFAULT_TRADER_PERIOD, type TraderDetail, type TraderPeriod } from '@/types/trader';
import ClientDetailPage from './_components/client-detail-page';
import type { PerformanceSnapshot } from '@/types/trader';

async function fetchServerData(
  address: string,
  period: TraderPeriod,
): Promise<{ detail: TraderDetail; performance: PerformanceSnapshot | null }> {
  const base = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080'
  ).replace(/\/$/, '');
  const detailUrl = `${base}/api/v1/traders/${address}?period=${encodeURIComponent(period)}&sync=1`;
  const perfUrl = `${base}/api/v1/traders/${address}/performance?period=${encodeURIComponent(period)}&mode=perps&sync=1&series_only=true`;
  const [detailRes, perfRes] = await Promise.all([
    fetch(detailUrl, { cache: 'no-store' }),
    fetch(perfUrl, { cache: 'no-store' }),
  ]);
  if (!detailRes.ok || !perfRes.ok) {
    throw new Error(`server fetch failed: ${detailRes.status}/${perfRes.status}`);
  }
  const detailJson = await detailRes.json().catch(() => ({}));
  const perfJson = await perfRes.json().catch(() => ({}));
  const detail = (detailJson?.data ?? detailJson) as TraderDetail;
  const performance = (perfJson?.data ?? perfJson ?? null) as PerformanceSnapshot | null;
  if (!detail) throw new Error('no detail data');
  return { detail, performance };
}

export default async function TraderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; address: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { address: rawAddress } = await params;
  const sp = await searchParams;
  const periodRaw = typeof sp?.period === 'string' ? sp.period : DEFAULT_TRADER_PERIOD;
  const period = (periodRaw as TraderPeriod) || DEFAULT_TRADER_PERIOD;
  const address = rawAddress ?? '';

  if (!isValidWalletAddress(address)) {
    return <ClientDetailPage address={address} period={period} />;
  }

  let initialDetail: TraderDetail | null = null;
  let initialPerformance: PerformanceSnapshot | null = null;
  let failed = false;
  try {
    const data = await fetchServerData(address.toLowerCase(), period);
    initialDetail = data.detail;
    initialPerformance = data.performance;
  } catch {
    failed = true;
  }

  if (failed || !initialDetail) {
    return <ClientDetailPage address={address} period={period} />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-4 lg:p-6" role="status" aria-label="Loading">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      }
    >
      <ClientDetailPage
        address={address}
        period={period}
        initialDetail={initialDetail}
        initialPerformance={initialPerformance}
      />
    </Suspense>
  );
}
