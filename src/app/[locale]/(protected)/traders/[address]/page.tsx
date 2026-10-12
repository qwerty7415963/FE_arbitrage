'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/infrastructure/api-client';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { useTraderDetail } from '@/hooks/use-trader-detail';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import { readLastScan } from '@/lib/trader-url-state';
import { isValidWalletAddress } from '@/lib/trader-validation';
import { WalletTabs } from './_components/wallet-tabs';
import { ActivityFeed } from './_components/activity-feed';
import { WalletIdentityCard } from './_components/wallet-identity-card';
import { WalletStatCards } from './_components/wallet-stat-cards';
import { AddToTraderGroupModal } from '@/components/shared/traders/add-to-trader-group-modal';
import {
  DEFAULT_TRADER_PERIOD,
  TRADER_PERIODS,
  type MemberInput,
  type TraderPeriod,
} from '@/types/trader';
import { ArrowLeftIcon } from 'lucide-react';

type DetailError = 'traderNotFound' | 'unknownError';

export default function TraderDetailPage() {
  return (
    <Suspense>
      <DetailContent />
    </Suspense>
  );
}

function DetailContent() {
  const params = useParams<{ locale: string; address: string }>();
  const router = useRouter();
  const t = useTranslations('traders');
  const address = params.address ?? '';

  const [period, setPeriod] = useState<TraderPeriod>(DEFAULT_TRADER_PERIOD);
  const [addOpen, setAddOpen] = useState(false);
  const addressValid = isValidWalletAddress(address);
  const wallet = addressValid ? address.toLowerCase() : '';
  // Live detail (contract v1.2): every number is LIVE for the viewed wallet.
  // No sync trigger, no polling-for-sync, no syncing states. Overview polls
  // every 30s while mounted; error stops polling and needs a manual retry.
  const {
    detail,
    isLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useTraderDetail(wallet, { period, enabled: addressValid });
  // Always-on panel queries (same hooks/endpoints as the lazy tab queries,
  // no new fetching logic): default positions sort + page-local period.
  const panelPositions = useTraderPositions(wallet, { enabled: addressValid });
  const activity = useTraderActivity(wallet);

  const error: DetailError | null =
    detailError instanceof ApiError && detailError.status === 404
      ? 'traderNotFound'
      : detailError
        ? 'unknownError'
        : null;

  const registry = detail?.registry ?? null;
  const metrics = detail?.metrics ?? null;
  const positionsSnapshot = panelPositions.snapshot;
  const lastUpdated =
    positionsSnapshot?.as_of ?? positionsSnapshot?.summary?.as_of ?? metrics?.metrics_as_of ?? null;

  function handleBack(): void {
    const lastScan = readLastScan();
    if (lastScan) {
      router.push(`/${params.locale}/traders?${lastScan}`);
    } else {
      router.back();
    }
  }
  const members: MemberInput[] = registry
    ? [{ venue: registry.venue, wallet_address: registry.wallet_address }]
    : [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          {t('backToScanner')}
        </Button>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <span className="text-muted-foreground">{t('title')}</span>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <span className="font-medium" aria-current="page">
          {t('walletDetail')}
        </span>
      </nav>

      <div className="flex flex-wrap items-end gap-2" role="group" aria-label={t('period')}>
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

      {!addressValid ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('invalidAddress')}
        </div>
      ) : isLoading && !detail ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-64 animate-pulse rounded-md" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3">
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {t(error)}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchDetail()}>
            {t('retry')}
          </Button>
        </div>
      ) : (
        registry && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <WalletIdentityCard
                registry={registry}
                lastUpdated={lastUpdated}
                metrics={metrics}
                onAdd={() => setAddOpen(true)}
              />

              <WalletStatCards
                summary={positionsSnapshot?.summary ?? null}
                positions={positionsSnapshot?.positions ?? []}
                metrics={metrics}
                isLoading={panelPositions.isLoading && !positionsSnapshot}
                error={!positionsSnapshot ? panelPositions.error : null}
                onRetry={() => panelPositions.refetch()}
              />

              <WalletTabs walletAddress={address.toLowerCase()} />
            </div>
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4 lg:max-h-[80vh] lg:overflow-y-auto">
                <ActivityFeed
                  items={activity.items}
                  live={activity.live}
                  connection={activity.connection}
                />
              </div>
            </div>
          </div>
        )
      )}

      <AddToTraderGroupModal
        open={addOpen}
        onOpenChange={setAddOpen}
        members={members}
        onSuccess={() => setAddOpen(false)}
      />
    </div>
  );
}
