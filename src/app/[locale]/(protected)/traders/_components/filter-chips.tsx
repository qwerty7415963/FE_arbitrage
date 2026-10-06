'use client';

import { useTranslations } from 'next-intl';
import {
  METRIC_DRAFT_KEYS,
  type FilterDraft,
  type MetricDraftKey,
  type MetricFilterKey,
} from '@/lib/trader-filter-draft';
import { XIcon } from 'lucide-react';

const CHIP_VISIBLE_LIMIT = 4;

const METRIC_UNITS: Record<MetricDraftKey, string> = {
  roi: '%',
  winRate: '%',
  longWinRate: '%',
  shortWinRate: '%',
  pnl: '$',
  volume: '$',
  tradeCount: '',
  profitFactor: '',
};

export interface ActiveFilterChip {
  key: MetricFilterKey;
  label: string;
}

function formatValue(value: string, unit: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (unit === '$') return `$${trimmed}`;
  if (unit === '%') return `${trimmed}%`;
  return trimmed;
}

export function deriveActiveFilters(
  draft: FilterDraft,
  metricLabel: (key: MetricDraftKey) => string,
  lastTradeLabel: string,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  for (const key of METRIC_DRAFT_KEYS) {
    const { min, max } = draft.ranges[key];
    const hasMin = min.trim() !== '';
    const hasMax = max.trim() !== '';
    if (!hasMin && !hasMax) continue;
    const unit = METRIC_UNITS[key];
    let value: string;
    if (hasMin && hasMax) {
      value = `${formatValue(min, unit)}\u2013${formatValue(max, unit)}`;
    } else if (hasMin) {
      value = `\u2265${formatValue(min, unit)}`;
    } else {
      value = `\u2264${formatValue(max, unit)}`;
    }
    chips.push({ key, label: `${metricLabel(key)} ${value}` });
  }
  const lastTrade = draft.lastTradeAfter.trim();
  if (lastTrade) {
    chips.push({
      key: 'lastTradeAfter',
      label: `${lastTradeLabel} \u2265 ${lastTrade.slice(0, 10)}`,
    });
  }
  return chips;
}

export interface FilterChipsProps {
  draft: FilterDraft;
  onRemove: (key: MetricFilterKey) => void;
  disabled?: boolean;
}

export function FilterChips({ draft, onRemove, disabled }: FilterChipsProps) {
  const t = useTranslations('traders');
  const chips = deriveActiveFilters(draft, (key) => t(key), t('filterSheet.lastTradeLabel'));
  if (chips.length === 0) return null;

  const visible = chips.slice(0, CHIP_VISIBLE_LIMIT);
  const overflow = chips.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="filter-chips">
      {visible.map((chip) => (
        <span
          key={chip.key}
          className="bg-muted/40 inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-xs"
        >
          <span className="max-w-48 truncate">{chip.label}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground rounded-full p-0.5 disabled:pointer-events-none disabled:opacity-50"
            disabled={disabled}
            aria-label={t('filterChips.remove', { label: chip.label })}
            onClick={() => onRemove(chip.key)}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      {overflow > 0 && (
        <span
          data-testid="filter-chips-overflow"
          className="text-muted-foreground bg-muted/40 inline-flex items-center rounded-full border px-2.5 py-1 text-xs"
        >
          {t('filterChips.more', { count: overflow })}
        </span>
      )}
    </div>
  );
}
