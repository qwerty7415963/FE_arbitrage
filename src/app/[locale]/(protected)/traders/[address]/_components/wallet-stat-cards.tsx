'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { NULL_DISPLAY } from '@/components/shared/traders/trader-table';
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import type {
  OpenPosition,
  PerformanceMetrics,
  PeriodMetrics,
  PositionSummary,
} from '@/types/trader';

export interface WalletStatCardsProps {
  summary: PositionSummary | null;
  positions: OpenPosition[];
  metrics: PeriodMetrics | PerformanceMetrics | null;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3 shadow-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

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

export function WalletStatCards({
  summary,
  positions,
  metrics,
  isLoading = false,
  error = null,
  onRetry,
}: WalletStatCardsProps) {
  const t = useTranslations('traders');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('retry')}
          </Button>
        )}
      </div>
    );
  }

  const available =
    summary?.account_value === null ||
    summary?.account_value === undefined ||
    summary?.total_margin_used === null ||
    summary?.total_margin_used === undefined
      ? null
      : summary.account_value - summary.total_margin_used;
  const unrealized = sumUnrealizedPnl(positions);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCard
          label={t('accountValue')}
          value={formatUsd(summary?.account_value) ?? NULL_DISPLAY}
        />
        <StatCard
          label={t('totalNotional')}
          value={formatUsd(summary?.total_ntl_pos) ?? NULL_DISPLAY}
        />
        <StatCard
          label={t('totalMargin')}
          value={formatUsd(summary?.total_margin_used) ?? NULL_DISPLAY}
        />
        <StatCard label={t('availableMargin')} value={formatUsd(available) ?? NULL_DISPLAY} />
        <StatCard
          label={t('unrealizedPnl')}
          value={unrealized === null ? NULL_DISPLAY : formatSignedUsd(unrealized)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <StatCard label={t('roi')} value={formatSignedPercent(metrics?.roi) ?? NULL_DISPLAY} />
        <StatCard label={t('winRate')} value={formatPercent(metrics?.win_rate) ?? NULL_DISPLAY} />
        <StatCard label={t('volume')} value={formatUsd(metrics?.volume) ?? NULL_DISPLAY} />
        <StatCard
          label={t('tradeCount')}
          value={formatInteger(metrics?.trade_count) ?? NULL_DISPLAY}
        />
        <StatCard
          label={t('profitFactor')}
          value={formatDecimal(metrics?.profit_factor) ?? NULL_DISPLAY}
        />
        <StatCard
          label={t('maxDrawdown')}
          value={formatDecimal(metrics?.max_drawdown_pct) ?? NULL_DISPLAY}
        />
      </div>
    </div>
  );
}
