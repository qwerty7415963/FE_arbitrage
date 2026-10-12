'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CopyAddress } from '@/components/shared/traders/copy-address';
import { NULL_DISPLAY } from '@/components/shared/traders/trader-table';
import { formatDateTimeUtc, formatRelativeTime, shortAddress } from '@/lib/trader-format';
import type {
  DiscoverySource,
  PeriodMetrics,
  PerformanceMetrics,
  RegistryEntry,
} from '@/types/trader';
import { EllipsisIcon, TrophyIcon } from 'lucide-react';

const SOURCE_LABEL_KEYS: Record<DiscoverySource, string> = {
  leaderboard: 'sourceLeaderboard',
  ws_trade: 'sourceWsTrade',
  both: 'sourceBoth',
  manual: 'sourceManual',
};

export interface WalletIdentityCardProps {
  registry: RegistryEntry;
  /** positions.as_of ?? metrics.metrics_as_of (ISO or null). */
  lastUpdated: string | null;
  onAdd: () => void;
  /** Metrics status line (same keys as the page-level status). Hidden when null. */
  metrics?: PeriodMetrics | PerformanceMetrics | null;
}

export function WalletIdentityCard({
  registry,
  lastUpdated,
  onAdd,
  metrics = null,
}: WalletIdentityCardProps) {
  const t = useTranslations('traders');
  const title = registry.display_name ?? shortAddress(registry.wallet_address);
  const initial = (title.trim().charAt(0) || '?').toUpperCase();
  const updatedAgo = lastUpdated ? formatRelativeTime(lastUpdated) : null;

  return (
    <section
      aria-label={title}
      className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm"
    >
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
          variant="ghost"
          size="sm"
          aria-label={t('addToGroup')}
          onClick={onAdd}
          className="shrink-0"
        >
          <EllipsisIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        {updatedAgo ? t('lastUpdated', { time: updatedAgo }) : NULL_DISPLAY}
      </p>

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

      {metrics && (
        <p className="text-muted-foreground text-xs">
          {t(metrics.data_status === 'error' ? 'statusError' : 'statusReady')}
          {metrics.metrics_as_of &&
            ` · ${t('metricsAsOf', { time: formatRelativeTime(metrics.metrics_as_of) ?? '' })}`}
          {metrics.is_partial && ` · ${t('partialData')}`}
        </p>
      )}
    </section>
  );
}
