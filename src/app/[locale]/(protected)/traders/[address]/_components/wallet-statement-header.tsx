'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
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
import {
  BellIcon,
  BellOffIcon,
  ChevronDownIcon,
  PencilIcon,
  TrophyIcon,
  UserRoundCheckIcon,
  UserRoundPlusIcon,
} from 'lucide-react';

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
  live?: string;
  wsStatus?: string;
  onAdd?: () => void;
  isFollowed?: boolean | null;
  notifyEnabled?: boolean;
  alias?: string | null;
  inGroups?: { id: string; name: string }[];
  onToggleFollow?: () => void;
  onToggleNotify?: () => void;
  onRename?: (alias: string) => void;
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
  live,
  wsStatus,
  onAdd,
  isFollowed,
  notifyEnabled,
  alias,
  inGroups = [],
  onToggleFollow,
  onToggleNotify,
  onRename,
}: WalletStatementHeaderProps) {
  const t = useTranslations('traders');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(alias ?? '');

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

  const title =
    (alias && alias.trim()) || registry.display_name || shortAddress(registry.wallet_address);
  const initial = (title.trim().charAt(0) || '?').toUpperCase();
  const updatedAgo = lastUpdated ? formatRelativeTime(lastUpdated) : null;

  const metricsAny = metrics as
    | (
        | PeriodMetrics
        | PerformanceMetrics
        | (Record<string, unknown> & (PeriodMetrics | PerformanceMetrics))
      )
    | null;
  const accountValue =
    (metricsAny as Record<string, unknown> | null)?.account_value !== undefined
      ? ((metricsAny as Record<string, unknown>).account_value as number | null)
      : (summary?.account_value ?? null);
  const totalNotional =
    (metricsAny as Record<string, unknown> | null)?.total_ntl_pos !== undefined
      ? ((metricsAny as Record<string, unknown>).total_ntl_pos as number | null)
      : (summary?.total_ntl_pos ?? null);
  const totalMargin =
    (metricsAny as Record<string, unknown> | null)?.total_margin_used !== undefined
      ? ((metricsAny as Record<string, unknown>).total_margin_used as number | null)
      : (summary?.total_margin_used ?? null);
  const hasAccountValue = accountValue !== null && accountValue > 0;

  const available =
    accountValue === null || totalMargin === null ? null : accountValue - totalMargin;
  const unrealized =
    (metricsAny as Record<string, unknown> | null)?.unrealized_pnl !== undefined
      ? ((metricsAny as Record<string, unknown>).unrealized_pnl as number | null)
      : sumUnrealizedPnl(positions);
  const unrealizedTone =
    unrealized === null || unrealized === 0
      ? undefined
      : unrealized > 0
        ? 'text-financial-positive'
        : 'text-destructive';
  const marginUsage =
    hasAccountValue && totalMargin !== null ? (totalMargin / accountValue) * 100 : null;
  const accountLeverage =
    hasAccountValue && totalNotional !== null ? totalNotional / accountValue : null;

  const wsState = (wsStatus ?? live ?? '').toUpperCase();
  const syncBadge =
    wsState === 'CONNECTED' || wsState === 'LIVE'
      ? 'LIVE'
      : wsState === 'RECONNECTING'
        ? 'RECONNECTING'
        : lastUpdated && updatedAgo
          ? `Synced ${updatedAgo}`
          : null;

  const statusParts = [
    syncBadge,
    metrics ? t(metrics.data_status === 'error' ? 'statusError' : 'statusReady') : null,
    updatedAgo ? t('lastUpdated', { time: updatedAgo }) : null,
    metrics?.metrics_as_of
      ? t('metricsAsOf', { time: formatRelativeTime(metrics.metrics_as_of) ?? '' })
      : null,
    metrics?.is_partial ? t('partialData') : null,
  ].filter((part): part is string => part !== null);

  return (
    <section
      aria-label={title}
      className="bg-surface border-border-subtle flex flex-col gap-4 rounded-xl border p-4"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="bg-primary-subtle text-primary-text flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
            >
              {initial}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="truncate text-xl font-semibold">{title}</h1>
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
                    className="bg-primary-subtle text-primary-text flex h-6 w-6 items-center justify-center rounded-full"
                  >
                    <TrophyIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}
                {inGroups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    className="bg-muted text-foreground hover:bg-interactive-hover rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onToggleFollow && (
              <Button
                type="button"
                variant={isFollowed ? 'outline' : 'default'}
                size="default"
                onClick={onToggleFollow}
                aria-label={isFollowed ? t('unfollow') : t('follow')}
                className="shrink-0"
              >
                {isFollowed ? (
                  <UserRoundCheckIcon className="size-4" aria-hidden />
                ) : (
                  <UserRoundPlusIcon className="size-4" aria-hidden />
                )}
                <span className="hidden sm:inline">{isFollowed ? t('unfollow') : t('follow')}</span>
              </Button>
            )}
            {isFollowed && onToggleNotify && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={notifyEnabled ? 'Mute Telegram alerts' : 'Enable Telegram alerts'}
                title={notifyEnabled ? 'Telegram alerts on' : 'Telegram alerts off'}
                onClick={onToggleNotify}
              >
                {notifyEnabled ? (
                  <BellIcon className="size-4" aria-hidden />
                ) : (
                  <BellOffIcon className="size-4" aria-hidden />
                )}
              </Button>
            )}
            {isFollowed && onRename && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('renameWallet')}
                title={t('renameWallet')}
                onClick={() => {
                  setAliasDraft(alias ?? '');
                  setRenameOpen(true);
                }}
              >
                <PencilIcon className="size-4" aria-hidden />
              </Button>
            )}
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
                  marginUsage > 70 ? 'bg-warning' : 'bg-primary',
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

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('renameWallet')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={aliasDraft}
              maxLength={100}
              placeholder={registry.display_name ?? shortAddress(registry.wallet_address)}
              onChange={(e) => setAliasDraft(e.target.value)}
              aria-label={t('renameWallet')}
            />
            <p className="text-muted-foreground text-xs">{t('renameWalletHint')}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onRename?.(aliasDraft.trim());
                setRenameOpen(false);
              }}
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
