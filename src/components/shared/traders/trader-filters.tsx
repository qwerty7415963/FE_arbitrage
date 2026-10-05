'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  disabled,
}: TraderFiltersProps) {
  const t = useTranslations('traders');

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-2">
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
