'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  activitySideTone,
  formatDateTimeUtc,
  formatNumber,
  formatRelativeTime,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import type { ActivityFill, ActivityTrade } from '@/types/trader';
import type { ActivityWsStatus } from '@/lib/trader-activity-ws';

export interface ActivityFeedProps {
  trades: ActivityTrade[];
  liveFills: ActivityFill[];
  isLoading: boolean;
  error: unknown;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  live: ActivityWsStatus;
}

export function ActivityFeed({
  trades,
  liveFills,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  live,
}: ActivityFeedProps) {
  const t = useTranslations('traders');

  if (isLoading && trades.length === 0 && liveFills.length === 0) {
    return (
      <section
        aria-label={t('recentActivity')}
        className="flex flex-col gap-2 rounded-lg border p-4"
      >
        <h2 className="text-sm font-semibold">{t('recentActivity')}</h2>
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-10 animate-pulse rounded-md" />
          <div className="bg-muted h-10 animate-pulse rounded-md" />
        </div>
      </section>
    );
  }

  if (error && trades.length === 0 && liveFills.length === 0) {
    return (
      <section
        aria-label={t('recentActivity')}
        className="flex flex-col gap-2 rounded-lg border p-4"
      >
        <h2 className="text-sm font-semibold">{t('recentActivity')}</h2>
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  const empty = trades.length === 0 && liveFills.length === 0;

  return (
    <section aria-label={t('recentActivity')} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{t('recentActivity')}</h2>
        {live === 'connected' && (
          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
            {t('live')}
          </span>
        )}
      </div>

      {empty ? (
        <p className="text-muted-foreground text-sm">{t('noActivity')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {liveFills.map((fill, index) => {
            const tone = activitySideTone(fill.side);
            return (
              <li
                key={`live-${fill.coin}-${fill.side}-${fill.tid}-${fill.time}-${index}`}
                className="flex flex-col gap-0.5 rounded-md border p-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[11px] font-medium">
                    {t('live')}
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      tone === 'positive' ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {t(fill.side === 'BUY' ? 'buy' : 'sell')}
                  </span>
                  <span className="font-medium">{fill.coin}</span>
                </span>
                <span
                  className="text-muted-foreground text-xs"
                  title={formatDateTimeUtc(fill.time) ?? undefined}
                >
                  {formatRelativeTime(fill.time) ?? fill.time} · {formatNumber(fill.size)} @{' '}
                  {formatUsd(fill.price) ?? '—'}
                </span>
              </li>
            );
          })}
          {trades.map((trade) => {
            const tone = activitySideTone(trade.side);
            return (
              <li
                key={`${trade.market}-${trade.opened_at}-${trade.closed_at}`}
                className="flex flex-col gap-0.5 rounded-md border p-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium',
                      tone === 'positive' ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {t(trade.side === 'LONG' ? 'long' : 'short')}
                  </span>
                  <span className="font-medium">{trade.market}</span>
                  <span
                    className={cn(
                      'tabular-nums',
                      trade.net_pnl > 0
                        ? 'text-primary'
                        : trade.net_pnl < 0
                          ? 'text-destructive'
                          : undefined,
                    )}
                  >
                    {formatSignedUsd(trade.net_pnl)}
                  </span>
                </span>
                <span
                  className="text-muted-foreground text-xs"
                  title={formatDateTimeUtc(trade.closed_at) ?? undefined}
                >
                  {formatRelativeTime(trade.closed_at) ?? trade.closed_at} · {t('netPnl')}:{' '}
                  {formatSignedUsd(trade.net_pnl)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <Button variant="outline" size="sm" onClick={onLoadMore}>
          {t('loadMore')}
        </Button>
      )}
    </section>
  );
}
