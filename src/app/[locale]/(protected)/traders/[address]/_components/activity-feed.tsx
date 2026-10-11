'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import {
  activitySideTone,
  formatDateTimeUtc,
  formatNumber,
  formatRelativeTime,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import type { ActivityFill, LiveActivityItem, WalletConnectionStatus } from '@/types/trader';
import type { ActivityWsStatus } from '@/lib/trader-activity-ws';

export interface ActivityFeedProps {
  items: LiveActivityItem[];
  live: ActivityWsStatus;
  /** Backend reconnect state; null until the first `wallet.connection.updated`. */
  connection?: WalletConnectionStatus | null;
}

function isLiveBadge(live: ActivityWsStatus, connection: WalletConnectionStatus | null): boolean {
  if (live !== 'connected') return false;
  // Legacy transport without connection events stays working (badge on
  // connected); once the backend sends states, gate strictly on LIVE.
  if (connection === null) return true;
  return connection === 'LIVE';
}

function fillLabelKey(fill: ActivityFill): 'long' | 'short' | 'buy' | 'sell' {
  const dir = typeof fill.dir === 'string' ? fill.dir.toLowerCase() : '';
  if (dir.includes('open long')) return 'long';
  if (dir.includes('open short')) return 'short';
  return fill.side === 'BUY' ? 'buy' : 'sell';
}

function fillToneSide(fill: ActivityFill): string {
  const key = fillLabelKey(fill);
  if (key === 'long') return 'LONG';
  if (key === 'short') return 'SHORT';
  return fill.side;
}

export function ActivityFeed({ items, live, connection = null }: ActivityFeedProps) {
  const t = useTranslations('traders');
  const showLive = isLiveBadge(live, connection);
  const isConnecting = live !== 'connected';

  if (isConnecting && items.length === 0) {
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

  return (
    <section aria-label={t('recentActivity')} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{t('recentActivity')}</h2>
        {showLive && (
          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
            {t('live')}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('activityWaiting')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => {
            if (item.kind === 'limit') {
              const order = item.order;
              const size = order.size ?? order.orig_size ?? null;
              const price = order.limit_px ?? null;
              const time = order.timestamp ?? order.time ?? item.time;
              const side = typeof order.side === 'string' ? order.side.toUpperCase() : null;
              return (
                <li
                  key={`limit-${order.coin}-${order.oid}-${item.time}-${index}`}
                  className="flex flex-col gap-0.5 rounded-md border p-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[11px] font-medium">
                      {t('limit')}
                    </span>
                    {side && <span className="font-medium">{side}</span>}
                    <span className="font-medium">{order.coin}</span>
                  </span>
                  <span
                    className="text-muted-foreground text-xs"
                    title={formatDateTimeUtc(time) ?? undefined}
                  >
                    {formatRelativeTime(time) ?? time} · {formatNumber(size)} @{' '}
                    {formatUsd(price) ?? '—'}
                  </span>
                </li>
              );
            }
            if (item.kind === 'fill') {
              const fill = item.fill;
              const labelKey = fillLabelKey(fill);
              const tone = activitySideTone(fillToneSide(fill));
              return (
                <li
                  key={`fill-${fill.coin}-${fill.side}-${fill.tid}-${fill.time}-${index}`}
                  className="flex flex-col gap-0.5 rounded-md border p-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium',
                        tone === 'positive' ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {t(labelKey)}
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
            }
            const trade = item.trade;
            const tone = activitySideTone(trade.side);
            return (
              <li
                key={`close-${trade.market}-${trade.opened_at}-${trade.closed_at}-${index}`}
                className="flex flex-col gap-0.5 rounded-md border p-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[11px] font-medium">
                    {t('closed')}
                  </span>
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
                  {formatRelativeTime(trade.closed_at) ?? trade.closed_at} ·{' '}
                  {formatNumber(trade.volume)} · {t('netPnl')}: {formatSignedUsd(trade.net_pnl)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
