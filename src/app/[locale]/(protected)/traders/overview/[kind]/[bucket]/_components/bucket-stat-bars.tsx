'use client';

import { useTranslations } from 'next-intl';
import type { BucketDetail, BucketNotionalSplit, BucketPnlSplit } from '@/types/trader';

export interface BucketStatBarsProps {
  detail?: BucketDetail | null;
  pnlSplit?: BucketPnlSplit;
  notionalSplit?: BucketNotionalSplit;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function BucketStatBars(props: BucketStatBarsProps) {
  const t = useTranslations('traders.bucketDetail');
  const detail = props.detail;
  const pnl = props.pnlSplit ??
    detail?.pnl_split ?? { pct_profit: 0, pct_loss: 0, usd_profit: 0, usd_loss: 0 };
  const notional = props.notionalSplit ?? detail?.notional_split ?? { long_usd: 0, short_usd: 0 };
  const totalNotional = (notional.long_usd || 0) + (notional.short_usd || 0);
  const longPct = totalNotional > 0 ? (notional.long_usd / totalNotional) * 100 : 50;
  const shortPct = 100 - longPct;

  return (
    <div
      data-testid="bucket-stat-bars"
      className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm"
    >
      <div>
        <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
          <span>{t('statBars.realizedPnl')}</span>
        </div>
        <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${Math.max(0, Math.min(100, pnl.pct_profit * 100))}%` }}
            data-testid="pnl-profit-bar"
          />
          <div
            className="h-full bg-rose-500"
            style={{ width: `${Math.max(0, Math.min(100, pnl.pct_loss * 100))}%` }}
            data-testid="pnl-loss-bar"
          />
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-xs">
          <span>
            {t('statBars.profit')} {fmt(pnl.usd_profit)} ({Math.round(pnl.pct_profit * 100)}%)
          </span>
          <span>
            {t('statBars.loss')} {fmt(pnl.usd_loss)} ({Math.round(pnl.pct_loss * 100)}%)
          </span>
        </div>
      </div>
      <div>
        <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
          <span>{t('statBars.notional')}</span>
        </div>
        <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${longPct}%` }}
            data-testid="notional-long-bar"
          />
          <div
            className="h-full bg-rose-500"
            style={{ width: `${shortPct}%` }}
            data-testid="notional-short-bar"
          />
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-xs">
          <span>
            {t('statBars.long')} {fmt(notional.long_usd)} ({Math.round(longPct)}%)
          </span>
          <span>
            {t('statBars.short')} {fmt(notional.short_usd)} ({Math.round(shortPct)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
