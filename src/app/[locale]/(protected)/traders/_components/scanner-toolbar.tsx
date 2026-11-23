'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TRADER_PERIODS,
  type TraderPeriod,
  TRADER_VENUES,
  GROUP_NAME_MAX_RUNES,
} from '@/types/trader';
import { ChevronDownIcon } from 'lucide-react';

export interface ScannerToolbarProps {
  period: TraderPeriod;
  onPeriodChange: (period: TraderPeriod) => void;
  venue: string;
  venues?: string[];
  onVenueChange?: (venue: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filtersCount: number;
  disabled?: boolean;
  onSaveFilter?: (name: string) => void;
  resultText?: string | null;
}

export function ScannerToolbar({
  period,
  onPeriodChange,
  venue,
  venues,
  onVenueChange,
  filtersOpen,
  onToggleFilters,
  filtersCount,
  disabled = false,
  onSaveFilter,
  resultText,
}: ScannerToolbarProps) {
  const t = useTranslations('traders');
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const venueList = venues && venues.length > 0 ? venues : venue ? [venue] : TRADER_VENUES;

  function openSave() {
    setSaveName('');
    setSaveOpen(true);
  }

  function closeSave() {
    setSaveOpen(false);
    setSaveName('');
  }

  function handleSaveSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = saveName.trim();
    if (!trimmed || disabled) return;
    onSaveFilter?.(trimmed);
    closeSave();
  }

  return (
    <div className="bg-background sticky top-0 z-20 -mx-4 mb-2 border-b px-4 pt-3 pb-3 backdrop-blur lg:-mx-6 lg:px-6">
      <div className="flex flex-col gap-3">
        {resultText && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm" aria-live="polite">
              {resultText}
            </span>
          </div>
        )}

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

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" disabled={disabled} aria-label={t('venue')} />
              }
            >
              {venue}
              <ChevronDownIcon className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {venueList.map((v) => (
                <DropdownMenuItem
                  key={v}
                  disabled={disabled || !onVenueChange}
                  onClick={() => onVenueChange?.(v)}
                >
                  {v}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            aria-controls="scanner-metric-filters"
            disabled={disabled}
            aria-label={filtersCount > 0 ? `${t('filters')} (${filtersCount})` : t('filters')}
          >
            {t('filters')}
            {filtersCount > 0 && (
              <span className="bg-primary text-primary-foreground ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs">
                {filtersCount}
              </span>
            )}
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={openSave}
            disabled={disabled || !onSaveFilter}
            aria-label={t('saveFilter')}
          >
            {t('saveFilter')}
          </Button>
        </div>
      </div>

      <Dialog open={saveOpen} onOpenChange={(next) => (next ? setSaveOpen(true) : closeSave())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('saveFilter')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{t('filterName')}</span>
              <Input
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={GROUP_NAME_MAX_RUNES}
                required
                aria-label={t('filterName')}
                placeholder={t('filterName')}
                disabled={disabled}
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeSave} disabled={disabled}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={disabled || saveName.trim().length === 0}>
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
