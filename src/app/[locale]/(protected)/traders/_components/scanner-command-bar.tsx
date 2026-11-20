'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TRADER_PERIODS, type TraderPeriod } from '@/types/trader';
import { RotateCcwIcon, ChevronDownIcon } from 'lucide-react';

export interface SavedView {
  name: string;
  onApply: () => void;
}

export interface ScannerCommandBarProps {
  title: string;
  resultText: string | null;
  refresh: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  disabled?: boolean;
  period: TraderPeriod;
  onPeriodChange: (period: TraderPeriod) => void;
  venue: string;
  filtersCount: number;
  savedViews?: SavedView[];
  onApplySavedSearch?: (query: unknown) => void;
}

export function ScannerCommandBar({
  title,
  resultText,
  refresh,
  filtersOpen,
  onToggleFilters,
  disabled,
  period,
  onPeriodChange,
  venue,
  filtersCount,
  savedViews = [],
}: ScannerCommandBarProps) {
  const t = useTranslations('traders');

  return (
    <div className="bg-background sticky -top-4 z-20 -mx-4 mb-2 border-b px-4 pt-3 pb-3 backdrop-blur lg:-top-6 lg:-mx-6 lg:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          {resultText && (
            <span className="text-muted-foreground text-sm" aria-live="polite">
              {resultText}
            </span>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={disabled}
            aria-label={t('refresh')}
          >
            <RotateCcwIcon className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" aria-label={t('savedViews')} />}
            >
              {t('savedViews')}
              <ChevronDownIcon className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {savedViews.length === 0 ? (
                <DropdownMenuItem disabled>{t('savedViews')}</DropdownMenuItem>
              ) : (
                savedViews.map((view) => (
                  <DropdownMenuItem
                    key={view.name}
                    onClick={() => view.onApply()}
                    disabled={disabled}
                  >
                    {view.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <span className="bg-muted text-foreground inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium capitalize">
            {venue}
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
            {filtersCount > 0 && (
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
              >
                {filtersCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
