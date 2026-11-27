'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { useTraderDetail } from '@/hooks/use-trader-detail';
import { useFollowStatus, useWalletFollowActions } from '@/hooks/use-follows';
import { useUnfollowConfirm } from '@/hooks/use-unfollow-confirm';
import { UnfollowConfirmDialog } from '@/components/shared/traders/unfollow-confirm-dialog';
import { useAuthStore } from '@/lib/stores/auth';
import { useTelegramStatus } from '@/hooks/use-telegram';

import { readLastScan } from '@/lib/trader-url-state';
import { isValidWalletAddress } from '@/lib/trader-validation';
import { WalletTabs } from './wallet-tabs';
import { ActivityFeed } from './activity-feed';
import { WalletStatementHeader } from './wallet-statement-header';
import { WalletPerformanceStrip } from './wallet-performance-strip';
import {
  DEFAULT_TRADER_PERIOD,
  type PerformanceSnapshot,
  type PositionSnapshot,
  type TraderDetail,
  type TraderPeriod,
} from '@/types/trader';
import { ArrowLeftIcon } from 'lucide-react';

export interface ClientDetailPageProps {
  address?: string;
  period?: TraderPeriod;
  initialDetail?: TraderDetail | null;
  initialPerformance?: PerformanceSnapshot | null;
}

type DetailError = 'traderNotFound' | 'unknownError';

export default function ClientDetailPage({
  address: addressProp,
  period: periodProp,
  initialDetail,
  initialPerformance: _initialPerformance,
}: ClientDetailPageProps) {
  void _initialPerformance;
  const params = useParams<{ locale: string; address: string }>();
  const router = useRouter();
  const t = useTranslations('traders');
  const address = addressProp ?? params.address ?? '';

  const [period, setPeriod] = useState<TraderPeriod>(periodProp ?? DEFAULT_TRADER_PERIOD);
  const [positionsSnapshot, setPositionsSnapshot] = useState<PositionSnapshot | null>(null);
  const addressValid = isValidWalletAddress(address);
  const wallet = addressValid ? address.toLowerCase() : '';
  const {
    detail,
    isLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useTraderDetail(wallet, {
    period,
    enabled: addressValid,
    initialData: initialDetail ?? undefined,
  });
  const activity = useTraderActivity(wallet);
  const venue = detail?.registry?.venue ?? '';
  const followStatus = useFollowStatus(venue, wallet);
  const { follow, unfollow, toggleNotify, rename } = useWalletFollowActions(venue, wallet);
  const unfollowConfirm = useUnfollowConfirm();
  const requireAuth = useAuthStore((s) => s.requireAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const telegramStatus = useTelegramStatus({ enabled: isAuthenticated });
  const isFollowed = followStatus.data ? followStatus.data.is_followed : undefined;
  const notifyEnabled = followStatus.data?.notify_enabled ?? false;
  const walletAlias = followStatus.data?.alias ?? null;
  const inGroups = followStatus.data?.in_groups ?? [];
  const telegramConnected = Boolean(
    followStatus.data?.telegram_connected || telegramStatus.data?.connected,
  );

  const error: DetailError | null =
    detailError instanceof ApiError && detailError.status === 404
      ? 'traderNotFound'
      : detailError
        ? 'unknownError'
        : null;

  const registry = detail?.registry ?? null;
  const metrics = detail?.metrics ?? null;
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

  return (
    <div className="flex flex-1 flex-col gap-4">
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

      {!addressValid ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('invalidAddress')}
        </div>
      ) : isLoading && !detail ? (
        <div className="flex flex-col gap-4" role="status" aria-label={t('loading')}>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl" />
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
          <div className="flex flex-col gap-4">
            <WalletStatementHeader
              registry={registry}
              summary={positionsSnapshot?.summary ?? null}
              positions={positionsSnapshot?.positions ?? []}
              metrics={metrics}
              lastUpdated={lastUpdated}
              live={activity.live}
              isFollowed={isFollowed}
              notifyEnabled={notifyEnabled}
              alias={walletAlias}
              inGroups={inGroups}
              telegramConnected={telegramConnected}
              onToggleFollow={() => {
                if (!requireAuth()) return;
                const venue = registry.venue;
                if (isFollowed) {
                  unfollowConfirm.requestUnfollow(
                    { venue, wallet, label: walletAlias || registry?.display_name || wallet },
                    () => unfollow.mutate(),
                  );
                } else {
                  follow.mutate({});
                }
              }}
              onToggleNotify={() => {
                if (!requireAuth()) return;
                toggleNotify.mutate(!notifyEnabled);
              }}
              onRename={(nextAlias: string) => {
                if (!requireAuth()) return;
                rename.mutate(nextAlias);
              }}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-4 lg:col-span-2">
                <WalletPerformanceStrip
                  period={period}
                  onPeriodChange={setPeriod}
                  metrics={metrics}
                />

                <WalletTabs
                  walletAddress={address.toLowerCase()}
                  period={period}
                  onPeriodChange={setPeriod}
                  onPositionsSnapshot={setPositionsSnapshot}
                />
              </div>
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-4 lg:max-h-[80vh] lg:overflow-y-auto">
                  <ActivityFeed
                    items={activity.items}
                    live={activity.live as 'connected' | 'disconnected' | 'reconnecting'}
                    connection={activity.connection}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <UnfollowConfirmDialog
        target={unfollowConfirm.target}
        skipChecked={unfollowConfirm.skipChecked}
        onSkipChange={unfollowConfirm.setSkipChecked}
        onConfirm={unfollowConfirm.confirm}
        onCancel={unfollowConfirm.cancel}
      />
    </div>
  );
}
