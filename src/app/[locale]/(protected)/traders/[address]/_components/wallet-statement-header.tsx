'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { CopyAddress } from '@/components/shared/traders/copy-address';
import {
  formatDateTimeUtc,
  formatDecimal,
  formatPercent,
  formatRelativeTime,
  formatSignedUsd,
  formatUsd,
  shortAddress,
} from '@/lib/trader-format';
import type {
  DiscoverySource,
  OpenPosition,
  PerformanceMetrics,
  PeriodMetrics,
  PositionSummary,
  RegistryEntry,
} from '@/types/trader';
import { ChevronDownIcon, TrophyIcon, UserPlusIcon } from 'lucide-react';

const NULL_GLYPH = '—';

const SOURCE_LABEL_KEYS: Record<DiscoverySource, string> = {
  leaderboard: 'sourceLeaderboard',
  ws_trade: 'sourceWsTrade',
  both: 'sourceBoth',
  manual: 'sourceManual',
};

/** Sum of non-null `unrealized_pnl` rows; null when no row carries a value. */
export function sumUnrealizedPnl(positions: OpenPosition[]): number | null {
  let total = 0;
  let seen = false;
  for (const p of positions) {
    if (p.unrealized_pnl === null || p.unrealized_pnl === undefined) continue;
    total += p.unrealized_pnl;
    seen = true;
  }
  return seen ? total : null;
}

export interface WalletStatementHeaderProps {
  registry: RegistryEntry;
  summary: PositionSummary | null;
  positions: OpenPosition[];
  metrics: PeriodMetrics | PerformanceMetrics | null;
  /** positions.as_of ?? positions.summary.as_of ?? metrics.metrics_as_of. */
  lastUpdated: string | null;
  onAdd: () => void;
}

function BalanceItem({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 lg:px-4 lg:first:pl-0 lg:last:pr-0">
      <dt className="text-label text-[13px] leading-4 font-medium">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
      {children}
    </div>
  );
}

export function WalletStatementHeader({
  registry,
  summary,
  positions,
  metrics,
  lastUpdated,
  onAdd,
}: WalletStatementHeaderProps) {
  const t = useTranslations('traders');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(max-width: 1023px)');
    // Sync once after hydration (initial render stays closed for a stable SSR
    // match); the subscription below handles later viewport changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailsOpen(query.matches);
    const onChange = (event: MediaQueryListEvent) => setDetailsOpen(event.matches);
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  const title = registry.display_name ?? shortAddress(registry.wallet_address);
  const initial = (title.trim().charAt(0) || '?').toUpperCase();
  const updatedAgo = lastUpdated ? formatRelativeTime(lastUpdated) : null;

  const accountValue = summary?.account_value ?? null;
  const totalNotional = summary?.total_ntl_pos ?? null;
  const totalMargin = summary?.total_margin_used ?? null;
  const hasAccountValue = accountValue !== null && accountValue > 0;

  const available =
    accountValue === null || totalMargin === null ? null : accountValue - totalMargin;
  const unrealized = sumUnrealizedPnl(positions);
  const unrealizedTone =
    unrealized === null || unrealized === 0
      ? undefined
      : unrealized > 0
        ? 'text-primary'
        : 'text-destructive';
  const marginUsage =
    hasAccountValue && totalMargin !== null ? (totalMargin / accountValue) * 100 : null;
  const accountLeverage =
    hasAccountValue && totalNotional !== null ? totalNotional / accountValue : null;

  const statusParts = [
    metrics ? t(metrics.data_status === 'error' ? 'statusError' : 'statusReady') : null,
    updatedAgo ? t('lastUpdated', { time: updatedAgo }) : null,
    metrics?.metrics_as_of
      ? t('metricsAsOf', { time: formatRelativeTime(metrics.metrics_as_of) ?? '' })
      : null,
    metrics?.is_partial ? t('partialData') : null,
  ].filter((part): part is string => part !== null);

  return (
    <section aria-label={title} className="bg-card flex flex-col gap-4 rounded-xl border p-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            >
              {initial}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="truncate text-xl font-bold">{title}</h1>
              <CopyAddress address={registry.wallet_address} short={false} />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                  {registry.venue}
                </span>
                {registry.discovery_source === 'leaderboard' && (
                  <span
                    role="img"
                    aria-label={t('sourceLeaderboard')}
                    title={t('sourceLeaderboard')}
                    className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full"
                  >
                    <TrophyIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onAdd}
              className="shrink-0"
            >
              <UserPlusIcon className="size-4" aria-hidden />
              {t('addToGroup')}
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            {statusParts.length > 0 ? statusParts.join(' · ') : NULL_GLYPH}
          </p>

          <details
            open={detailsOpen}
            onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
            className="group"
          >
            <summary className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium [&::-webkit-details-marker]:hidden">
              <ChevronDownIcon
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                aria-hidden
              />
              {t('details')}
            </summary>
            <dl className="grid grid-cols-2 gap-3 pt-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground text-xs">{t('firstSeen')}</dt>
                <dd>{formatDateTimeUtc(registry.first_seen_at) ?? NULL_GLYPH}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('lastSeen')}</dt>
                <dd>{formatDateTimeUtc(registry.last_seen_at) ?? NULL_GLYPH}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('colLastTrade')}</dt>
                <dd title={formatDateTimeUtc(registry.last_trade_at) ?? undefined}>
                  {formatRelativeTime(registry.last_trade_at) ?? NULL_GLYPH}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('discoverySource')}</dt>
                <dd>{t(SOURCE_LABEL_KEYS[registry.discovery_source])}</dd>
              </div>
            </dl>
          </details>
        </div>

        <div className="flex flex-col gap-3 lg:items-end lg:text-right">
          <div>
            <span className="text-label block text-[13px] font-medium">{t('accountValue')}</span>
            <span className="block text-[40px] leading-none font-semibold tracking-tight tabular-nums">
              {formatUsd(accountValue) ?? NULL_GLYPH}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 lg:justify-end">
            <div>
              <span className="text-label block text-[13px] font-medium">{t('unrealizedPnl')}</span>
              <span className={cn('block text-xl font-semibold tabular-nums', unrealizedTone)}>
                {formatSignedUsd(unrealized)}
              </span>
            </div>
            <div>
              <span className="text-label block text-[13px] font-medium">
                {t('availableMargin')}
              </span>
              <span className="block text-xl font-semibold tabular-nums">
                {formatUsd(available) ?? NULL_GLYPH}
              </span>
            </div>
          </div>
        </div>
      </div>

      <dl className="lg:divide-border grid grid-cols-2 gap-4 border-t pt-3 sm:grid-cols-4 lg:divide-x">
        <BalanceItem label={t('totalNotional')} value={formatUsd(totalNotional) ?? NULL_GLYPH} />
        <BalanceItem label={t('totalMargin')} value={formatUsd(totalMargin) ?? NULL_GLYPH} />
        <BalanceItem label={t('marginUsage')} value={formatPercent(marginUsage, 1) ?? NULL_GLYPH}>
          {marginUsage !== null && (
            <div
              role="progressbar"
              aria-label={t('marginUsage')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(marginUsage * 10) / 10}
              className="bg-muted mt-1 h-1.5 w-24 overflow-hidden rounded-full"
            >
              <div
                className={cn(
                  'h-full rounded-full',
                  marginUsage > 70 ? 'bg-amber-500' : 'bg-primary',
                )}
                style={{ width: `${Math.min(100, Math.max(0, marginUsage))}%` }}
              />
            </div>
          )}
        </BalanceItem>
        <BalanceItem
          label={t('accountLeverage')}
          value={accountLeverage === null ? NULL_GLYPH : `${formatDecimal(accountLeverage)}×`}
        />
      </dl>
    </section>
  );
}
