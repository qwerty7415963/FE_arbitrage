'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { TRADER_PERIODS, type TraderPeriod } from '@/types/trader';

export interface ScannerHeaderProps {
  period: TraderPeriod;
  onPeriodChange: (period: TraderPeriod) => void;
  venue: string;
  resultText: string | null;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  disabled?: boolean;
}

export function ScannerHeader({
  period,
  onPeriodChange,
  venue,
  resultText,
  filtersOpen,
  onToggleFilters,
  disabled,
}: ScannerHeaderProps) {
  const t = useTranslations('traders');

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
      </div>
    </div>
  );
}
