'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  TRADER_PERIODS,
  TRADER_SORT_COLUMNS,
  type SortDirection,
  type TraderGroup,
  type TraderPeriod,
  type TraderSortBy,
} from '@/types/trader';

const SORT_LABEL_KEYS: Record<TraderSortBy, string> = {
  pnl: 'colPnl',
  roi: 'colRoi',
  win_rate: 'colWinRate',
  volume: 'colVolume',
  trade_count: 'colTrades',
  last_trade: 'colLastTrade',
};

export interface ScannerHeaderProps {
  period: TraderPeriod;
  onPeriodChange: (period: TraderPeriod) => void;
  venue: string;
  groups: TraderGroup[] | null;
  groupId: string;
  onGroupChange: (groupId: string) => void;
  resultText: string | null;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  sortBy: TraderSortBy;
  sortDirection: SortDirection;
  onSortSelect: (sortBy: TraderSortBy, direction: SortDirection) => void;
  disabled?: boolean;
}

export function ScannerHeader({
  period,
  onPeriodChange,
  venue,
  groups,
  groupId,
  onGroupChange,
  resultText,
  filtersOpen,
  onToggleFilters,
  sortBy,
  sortDirection,
  onSortSelect,
  disabled,
}: ScannerHeaderProps) {
  const t = useTranslations('traders');

  function handleSortValue(value: string) {
    const separator = value.lastIndexOf(':');
    const nextSort = value.slice(0, separator) as TraderSortBy;
    const nextDirection = value.slice(separator + 1) as SortDirection;
    onSortSelect(nextSort, nextDirection);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {resultText && (
          <span className="text-muted-foreground text-sm" aria-live="polite">
            {resultText}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('period')}</span>
          <span
            role="group"
            aria-label={t('period')}
            className="border-input bg-background inline-flex overflow-hidden rounded-lg border"
          >
            {TRADER_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                aria-label={p}
                aria-pressed={p === period}
                disabled={disabled}
                onClick={() => onPeriodChange(p)}
                className={cn(
                  'text-foreground px-2.5 py-1.5 text-sm transition-colors',
                  p === period && 'bg-primary text-primary-foreground font-medium',
                )}
              >
                {p}
              </button>
            ))}
          </span>
        </label>

        <span className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('venue')}</span>
          <span className="bg-muted text-foreground inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium capitalize">
            {venue}
          </span>
        </span>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('group')}</span>
          <select
            value={groupId}
            onChange={(e) => onGroupChange(e.target.value)}
            className="border-input bg-background text-foreground h-8 min-w-36 rounded-lg border px-2 text-sm"
            disabled={disabled || groups === null}
            aria-describedby={groups === null ? 'group-auth-hint' : undefined}
          >
            <option value="">{t('allGroups')}</option>
            {(groups ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        {groups === null && (
          <span id="group-auth-hint" className="text-muted-foreground text-xs">
            {t('groupAuthHint')}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="scanner-metric-filters"
          disabled={disabled}
        >
          {t('filters')}
        </Button>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('sortLabel')}</span>
          <select
            value={`${sortBy}:${sortDirection}`}
            onChange={(e) => handleSortValue(e.target.value)}
            className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
            disabled={disabled}
          >
            {TRADER_SORT_COLUMNS.map((column) =>
              (['desc', 'asc'] as const).map((direction) => (
                <option key={`${column}:${direction}`} value={`${column}:${direction}`}>
                  {t(SORT_LABEL_KEYS[column])} {direction === 'desc' ? '↓' : '↑'}
                </option>
              )),
            )}
          </select>
        </label>
      </div>
    </div>
  );
}
