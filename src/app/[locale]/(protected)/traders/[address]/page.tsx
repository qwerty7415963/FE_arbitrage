'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/infrastructure/api-client';
import { fetchTraderDetail } from '@/services/traders';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { readLastScan } from '@/lib/trader-url-state';
import { isValidWalletAddress } from '@/lib/trader-validation';
import { WalletTabs } from './_components/wallet-tabs';
import { ActivityFeed } from './_components/activity-feed';
import {
  deriveWinRate,
  formatDateTimeUtc,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatRelativeTime,
  formatSignedPercent,
  formatUsd,
  shortAddress,
} from '@/lib/trader-format';
import { CopyAddress } from '@/components/shared/traders/copy-address';
import { NULL_DISPLAY } from '@/components/shared/traders/trader-table';
import { AddToTraderGroupModal } from '@/components/shared/traders/add-to-trader-group-modal';
import {
  DEFAULT_TRADER_PERIOD,
  TRADER_PERIODS,
  type DiscoverySource,
  type MemberInput,
  type TraderDetail,
  type TraderPeriod,
} from '@/types/trader';
import { ArrowLeftIcon, PlusIcon } from 'lucide-react';

type DetailError = 'traderNotFound' | 'unknownError';

const SOURCE_LABEL_KEYS: Record<DiscoverySource, string> = {
  leaderboard: 'sourceLeaderboard',
  ws_trade: 'sourceWsTrade',
  both: 'sourceBoth',
  manual: 'sourceManual',
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
    </div>
  );
}

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
  const [detail, setDetail] = useState<TraderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(() => isValidWalletAddress(address));
  const [error, setError] = useState<DetailError | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const addressValid = isValidWalletAddress(address);
  const wallet = addressValid ? address.toLowerCase() : '';
  // Live detail (contract v1.2): every number is LIVE for the viewed wallet.
  // No sync trigger, no polling-for-sync, no syncing states.
  const activity = useTraderActivity(wallet);

  useEffect(() => {
    if (!addressValid) return;
    let cancelled = false;
    async function fetchDetail() {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTraderDetail(address.toLowerCase(), { period });
        if (cancelled || requestIdRef.current !== requestId) return;
        setDetail(data);
      } catch (err) {
        if (cancelled || requestIdRef.current !== requestId) return;
        if (err instanceof ApiError && err.status === 404) {
          setError('traderNotFound');
        } else {
          setError('unknownError');
        }
      } finally {
        if (!cancelled && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }
    void fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [address, period, reloadKey, addressValid]);

  const registry = detail?.registry ?? null;
  const metrics = detail?.metrics ?? null;
  const longWr = deriveWinRate(metrics?.long_wins, metrics?.long_count);
  const shortWr = deriveWinRate(metrics?.short_wins, metrics?.short_count);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          {t('backToScanner')}
        </Button>
        {registry && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('addToGroup')}
          </Button>
        )}
      </div>

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
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            {t('retry')}
          </Button>
        </div>
      ) : (
        registry && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="flex flex-col gap-2 rounded-lg border p-4">
                <h1 className="text-xl font-bold">
                  {registry.display_name ?? shortAddress(registry.wallet_address)}
                </h1>
                <CopyAddress address={registry.wallet_address} short={false} />
                <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground text-xs">{t('firstSeen')}</dt>
                    <dd>{formatDateTimeUtc(registry.first_seen_at) ?? NULL_DISPLAY}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">{t('lastSeen')}</dt>
                    <dd>{formatDateTimeUtc(registry.last_seen_at) ?? NULL_DISPLAY}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">{t('colLastTrade')}</dt>
                    <dd title={formatDateTimeUtc(registry.last_trade_at) ?? undefined}>
                      {formatRelativeTime(registry.last_trade_at) ?? NULL_DISPLAY}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">{t('discoverySource')}</dt>
                    <dd>{t(SOURCE_LABEL_KEYS[registry.discovery_source])}</dd>
                  </div>
                </dl>
              </div>

              {metrics && (
                <p className="text-muted-foreground text-xs">
                  {t(metrics.data_status === 'error' ? 'statusError' : 'statusReady')}
                  {metrics.metrics_as_of &&
                    ` · ${t('metricsAsOf', { time: formatRelativeTime(metrics.metrics_as_of) ?? '' })}`}
                  {metrics.is_partial && ` · ${t('partialData')}`}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetricCard label="ROI" value={formatSignedPercent(metrics?.roi) ?? NULL_DISPLAY} />
                <MetricCard
                  label={t('pnl')}
                  value={
                    metrics?.pnl === null || metrics?.pnl === undefined
                      ? NULL_DISPLAY
                      : `${metrics.pnl > 0 ? '+' : ''}${formatUsd(metrics.pnl)}`
                  }
                />
                <MetricCard
                  label={t('winRate')}
                  value={formatPercent(metrics?.win_rate) ?? NULL_DISPLAY}
                />
                <MetricCard
                  label={t('volume')}
                  value={formatUsd(metrics?.volume) ?? NULL_DISPLAY}
                />
                <MetricCard
                  label={t('tradeCount')}
                  value={formatInteger(metrics?.trade_count) ?? NULL_DISPLAY}
                />
                <MetricCard
                  label={t('profitFactor')}
                  value={formatDecimal(metrics?.profit_factor) ?? NULL_DISPLAY}
                />
                <MetricCard
                  label={t('maxDrawdown')}
                  value={formatDecimal(metrics?.max_drawdown_pct) ?? NULL_DISPLAY}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-4">
                <h2 className="text-sm font-semibold">{t('longShortStats')}</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground text-xs">{t('longPositions')}</span>
                    <span>
                      {formatPercent(longWr) ?? NULL_DISPLAY} ·{' '}
                      {t('countWins', {
                        wins: metrics?.long_wins ?? 0,
                        count: metrics?.long_count ?? 0,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground text-xs">{t('shortPositions')}</span>
                    <span>
                      {formatPercent(shortWr) ?? NULL_DISPLAY} ·{' '}
                      {t('countWins', {
                        wins: metrics?.short_wins ?? 0,
                        count: metrics?.short_count ?? 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <WalletTabs walletAddress={address.toLowerCase()} />
            </div>
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4 lg:max-h-[80vh] lg:overflow-y-auto">
                <ActivityFeed
                  trades={activity.trades}
                  liveFills={activity.liveFills}
                  liveFundings={activity.liveFundings}
                  isLoading={activity.isLoading}
                  error={activity.error}
                  hasMore={activity.hasMore}
                  onLoadMore={activity.fetchNextPage}
                  onRetry={activity.refetch}
                  live={activity.live}
                  connection={activity.connection}
                  dataStatus={activity.dataStatus}
                  asOf={activity.asOf}
                  partial={activity.partial}
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
