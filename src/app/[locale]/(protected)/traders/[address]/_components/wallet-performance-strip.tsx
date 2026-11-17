'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatSignedPercent,
  formatUsd,
} from '@/lib/trader-format';
import {
  TRADER_PERIODS,
  type PerformanceMetrics,
  type PeriodMetrics,
  type TraderPeriod,
} from '@/types/trader';

const NULL_GLYPH = '—';

export interface WalletPerformanceStripProps {
  period: TraderPeriod;
  onPeriodChange: (p: TraderPeriod) => void;
  metrics: PeriodMetrics | PerformanceMetrics | null;
}

export function WalletPerformanceStrip({
  period,
  onPeriodChange,
  metrics,
}: WalletPerformanceStripProps) {
  const t = useTranslations('traders');

  const items = [
    { key: 'roi', label: t('roi'), value: formatSignedPercent(metrics?.roi) },
    { key: 'winRate', label: t('winRate'), value: formatPercent(metrics?.win_rate) },
    { key: 'volume', label: t('volume'), value: formatUsd(metrics?.volume) },
    { key: 'tradeCount', label: t('tradeCount'), value: formatInteger(metrics?.trade_count) },
    {
      key: 'profitFactor',
      label: t('profitFactor'),
      value: formatDecimal(metrics?.profit_factor),
    },
    {
      key: 'maxDrawdown',
      label: t('maxDrawdown'),
      value: formatDecimal(metrics?.max_drawdown_pct),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('period')}>
        {TRADER_PERIODS.map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            aria-pressed={period === p}
            onClick={() => onPeriodChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.key}>
            <dt className="text-label text-xs font-medium">{item.label}</dt>
            <dd className="text-lg leading-snug font-semibold tabular-nums">
              {item.value ?? NULL_GLYPH}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
