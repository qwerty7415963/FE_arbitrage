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
import { ArrowDownUpIcon, CheckIcon, PlusIcon } from 'lucide-react';

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

function notionalUsd(size: unknown, price: unknown): string | null {
  if (typeof size !== 'number' || typeof price !== 'number') return null;
  if (!Number.isFinite(size) || !Number.isFinite(price)) return null;
  return formatUsd(size * price);
}

export function ActivityFeed({ items, live, connection = null }: ActivityFeedProps) {
  const t = useTranslations('traders');
  const showLive = isLiveBadge(live, connection);
  const isConnecting = live !== 'connected';

  if (isConnecting && items.length === 0) {
    return (
      <section
        aria-label={t('recentActivity')}
        className="bg-card flex flex-col gap-2 rounded-xl border p-4 shadow-sm"
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
    <section
      aria-label={t('recentActivity')}
      className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{t('recentActivity')}</h2>
        {showLive && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
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
              const notional = notionalUsd(size, price);
              return (
                <li
                  key={`limit-${order.coin}-${order.oid}-${item.time}-${index}`}
                  className="flex items-start gap-2.5 rounded-lg border px-2.5 py-2 text-sm"
                >
                  <span
                    aria-hidden
                    className="bg-primary/10 text-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{t('limit')}</span>
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
                    {notional !== null && (
                      <span className="text-muted-foreground text-xs">approx {notional}</span>
                    )}
                  </span>
                </li>
              );
            }
            if (item.kind === 'fill') {
              const fill = item.fill;
              const labelKey = fillLabelKey(fill);
              const tone = activitySideTone(fillToneSide(fill));
              const notional = notionalUsd(fill.size, fill.price);
              return (
                <li
                  key={`fill-${fill.coin}-${fill.side}-${fill.tid}-${fill.time}-${index}`}
                  className="flex items-start gap-2.5 rounded-lg border px-2.5 py-2 text-sm"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      tone === 'positive'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    <ArrowDownUpIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'font-semibold',
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
                    {notional !== null && (
                      <span className="text-muted-foreground text-xs">approx {notional}</span>
                    )}
                  </span>
                </li>
              );
            }
            const trade = item.trade;
            const tone = activitySideTone(trade.side);
            return (
              <li
                key={`close-${trade.market}-${trade.opened_at}-${trade.closed_at}-${index}`}
                className="flex items-start gap-2.5 rounded-lg border px-2.5 py-2 text-sm"
              >
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{t('closed')}</span>
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
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
