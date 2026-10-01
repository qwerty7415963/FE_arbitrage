'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TRADER_PERIODS, TRADER_VENUES, type TraderGroup, type TraderPeriod } from '@/types/trader';
import {
  METRIC_DRAFT_KEYS,
  updateDraftRange,
  type FilterDraft,
  type MetricDraftKey,
} from '@/lib/trader-filter-draft';

export interface TraderFiltersProps {
  draft: FilterDraft;
  onDraftChange: (draft: FilterDraft) => void;
  onSearch: () => void;
  onReset: () => void;
  groups: TraderGroup[] | null;
  disabled?: boolean;
}

const METRIC_LABEL_KEYS: Record<MetricDraftKey, string> = {
  roi: 'roi',
  winRate: 'winRate',
  pnl: 'pnl',
  volume: 'volume',
  tradeCount: 'tradeCount',
  profitFactor: 'profitFactor',
  longWinRate: 'longWinRate',
  shortWinRate: 'shortWinRate',
};

export function TraderFilters({
  draft,
  onDraftChange,
  onSearch,
  onReset,
  groups,
  disabled,
}: TraderFiltersProps) {
  const t = useTranslations('traders');

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('venue')}</span>
          <select
            value={draft.venue}
            onChange={(e) => onDraftChange({ ...draft, venue: e.target.value })}
            className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
            disabled={disabled}
          >
            {TRADER_VENUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('period')}</span>
          <select
            value={draft.period}
            onChange={(e) => onDraftChange({ ...draft, period: e.target.value as TraderPeriod })}
            className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
            disabled={disabled}
          >
            {TRADER_PERIODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t('group')}</span>
          <select
            value={draft.groupId}
            onChange={(e) => onDraftChange({ ...draft, groupId: e.target.value })}
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

        <Button onClick={onSearch} disabled={disabled}>
          {t('search')}
        </Button>

        <Button variant="outline" size="sm" onClick={onReset} disabled={disabled}>
          {t('reset')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METRIC_DRAFT_KEYS.map((key) => {
          const label = t(METRIC_LABEL_KEYS[key]);
          return (
            <fieldset key={key} className="flex flex-col gap-1">
              <legend className="text-muted-foreground text-xs">{label}</legend>
              <div className="flex gap-1">
                <Input
                  inputMode="decimal"
                  value={draft.ranges[key].min}
                  aria-label={`${label} ${t('minPlaceholder')}`}
                  placeholder={t('minPlaceholder')}
                  className="h-8"
                  disabled={disabled}
                  onChange={(e) =>
                    onDraftChange(updateDraftRange(draft, key, 'min', e.target.value))
                  }
                />
                <Input
                  inputMode="decimal"
                  value={draft.ranges[key].max}
                  aria-label={`${label} ${t('maxPlaceholder')}`}
                  placeholder={t('maxPlaceholder')}
                  className="h-8"
                  disabled={disabled}
                  onChange={(e) =>
                    onDraftChange(updateDraftRange(draft, key, 'max', e.target.value))
                  }
                />
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
