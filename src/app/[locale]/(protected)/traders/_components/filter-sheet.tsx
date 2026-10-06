'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { validateDraftFields, type TraderSearchError } from '@/lib/trader-validation';
import {
  draftFromQuery,
  draftToQuery,
  updateDraftRange,
  type FilterDraft,
  type MetricDraftKey,
} from '@/lib/trader-filter-draft';
import { SavedSearches } from '@/components/shared/traders/saved-searches';
import {
  SCANNER_PAGE_SIZE,
  type SortDirection,
  type TraderSearchQuery,
  type TraderSortBy,
} from '@/types/trader';
import { XIcon } from 'lucide-react';

type RangeKey =
  | 'roi'
  | 'pnl'
  | 'volume'
  | 'tradeCount'
  | 'winRate'
  | 'profitFactor'
  | 'longWinRate'
  | 'shortWinRate';

const RANGE_LABEL_KEYS: Record<RangeKey, { min: string; max: string }> = {
  roi: { min: 'roiMin', max: 'roiMax' },
  pnl: { min: 'pnlMin', max: 'pnlMax' },
  volume: { min: 'volumeMin', max: 'volumeMax' },
  tradeCount: { min: 'tradeCountMin', max: 'tradeCountMax' },
  winRate: { min: 'winRateMin', max: 'winRateMax' },
  profitFactor: { min: 'profitFactorMin', max: 'profitFactorMax' },
  longWinRate: { min: 'longWinRateMin', max: 'longWinRateMax' },
  shortWinRate: { min: 'shortWinRateMin', max: 'shortWinRateMax' },
};

const METRIC_LABEL_KEYS: Record<string, string> = {
  winRate: 'winRateLabel',
  profitFactor: 'profitFactorLabel',
  longWinRate: 'longWinRateLabel',
  shortWinRate: 'shortWinRateLabel',
};

const ERROR_LABEL_KEYS: Record<TraderSearchError, string> = {
  invalidNumber: 'errInvalidNumber',
  invalidInteger: 'errInvalidInteger',
  outOfRange: 'errOutOfRange',
  minGreaterThanMax: 'errMinGreaterThanMax',
  invalidDateTime: 'errInvalidDateTime',
  invalidLimit: 'errInvalidNumber',
  invalidSort: 'errInvalidNumber',
  invalidPeriod: 'errInvalidNumber',
};

const FIELD_ORDER: Array<RangeKey | 'lastTradeAfter'> = [
  'roi',
  'pnl',
  'winRate',
  'profitFactor',
  'volume',
  'tradeCount',
  'lastTradeAfter',
  'longWinRate',
  'shortWinRate',
];

const WIN_RATE_PRESETS = ['50%', '55%', '60%'];
const WIN_RATE_PRESETS_SHORT = ['50%', '55%'];
const PROFIT_FACTOR_PRESETS = ['1.0', '1.5', '2.0'];

const LAST_TRADE_PRESETS: { key: string; hours: number }[] = [
  { key: 'lastTrade24h', hours: 24 },
  { key: 'lastTrade7d', hours: 24 * 7 },
  { key: 'lastTrade30d', hours: 24 * 30 },
];

const CUSTOM_METRICS: RangeKey[] = ['winRate', 'profitFactor', 'longWinRate', 'shortWinRate'];

export interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: FilterDraft;
  onApply: (draft: FilterDraft) => void;
  onResetFilters: () => void;
  onApplySavedSearch: (query: TraderSearchQuery) => void;
  sortBy: TraderSortBy;
  sortDirection: SortDirection;
  disabled?: boolean;
}

const PRESET_MIN_VALUES: Partial<Record<RangeKey, string[]>> = {
  winRate: WIN_RATE_PRESETS.map((preset) => preset.replace('%', '')),
  profitFactor: PROFIT_FACTOR_PRESETS,
  longWinRate: WIN_RATE_PRESETS_SHORT.map((preset) => preset.replace('%', '')),
  shortWinRate: WIN_RATE_PRESETS_SHORT.map((preset) => preset.replace('%', '')),
};

const LAST_TRADE_PRESET_TOLERANCE_MS = 5 * 60 * 1000;

function matchesPreset(key: RangeKey, range: { min: string; max: string }): boolean {
  if (range.min === '' && range.max === '') return true;
  if (range.max !== '') return false;
  const presets = PRESET_MIN_VALUES[key];
  if (presets === undefined) return false;
  // So sanh theo gia tri so de preset song sot qua vong URL
  // (draftToQuery/draftFromQuery chuan hoa 1.0 -> '1', 2.0 -> '2').
  const min = Number(range.min);
  if (Number.isNaN(min)) return false;
  return presets.some((preset) => Number(preset) === min);
}

function isLastTradePreset(value: string): boolean {
  if (!value) return true;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  const now = Date.now();
  return LAST_TRADE_PRESETS.some(
    (preset) => Math.abs(now - preset.hours * 3_600_000 - parsed) <= LAST_TRADE_PRESET_TOLERANCE_MS,
  );
}

function deriveCustom(draft: FilterDraft): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const key of CUSTOM_METRICS) {
    next[key] = !matchesPreset(key, draft.ranges[key]);
  }
  next.lastTradeAfter = !isLastTradePreset(draft.lastTradeAfter);
  return next;
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export function FilterSheet({
  open,
  onOpenChange,
  draft,
  onApply,
  onResetFilters,
  onApplySavedSearch,
  sortBy,
  sortDirection,
  disabled,
}: FilterSheetProps) {
  const t = useTranslations('traders');
  const [local, setLocal] = useState<FilterDraft>(draft);
  const [custom, setCustom] = useState<Record<string, boolean>>(() => deriveCustom(draft));
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  });

  useEffect(() => {
    if (open) {
      setLocal(draftRef.current);
      setCustom(deriveCustom(draftRef.current));
    }
  }, [open]);

  const errors = useMemo(() => validateDraftFields(local), [local]);
  const firstError = FIELD_ORDER.find((field) => errors[field] !== undefined);

  const savedSearchQuery = useMemo<TraderSearchQuery>(
    () => ({ ...draftToQuery(local), sortBy, sortDirection, limit: SCANNER_PAGE_SIZE }),
    [local, sortBy, sortDirection],
  );

  function messageFor(key: RangeKey) {
    const code = errors[key];
    return {
      id: `filter-msg-${key}`,
      invalid: code !== undefined,
      error: code ? t(`filterSheet.${ERROR_LABEL_KEYS[code]}`) : undefined,
      helper:
        key === 'tradeCount'
          ? t('filterSheet.tradeCountHint')
          : key === 'profitFactor'
            ? t('filterSheet.profitFactorHint')
            : undefined,
      isFirst: firstError === key,
    };
  }

  function setRange(key: RangeKey, bound: 'min' | 'max', value: string) {
    setLocal((prev) => updateDraftRange(prev, key as MetricDraftKey, bound, value));
  }

  function setPreset(key: RangeKey, min: string) {
    setLocal((prev) => ({ ...prev, ranges: { ...prev.ranges, [key]: { min, max: '' } } }));
  }

  function toggleCustom(key: string) {
    setCustom((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(local);
    onOpenChange(false);
  }

  function handleResetFilters() {
    onResetFilters();
    onOpenChange(false);
  }

  function handleApplySavedSearch(query: TraderSearchQuery) {
    const next = draftFromQuery(query);
    setLocal(next);
    setCustom(deriveCustom(next));
    onApplySavedSearch(query);
    onOpenChange(false);
  }

  function renderPair(key: RangeKey) {
    const labels = RANGE_LABEL_KEYS[key];
    const msg = messageFor(key);
    const inputMode = key === 'tradeCount' ? 'numeric' : 'decimal';
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-muted-foreground text-xs">{t(`filterSheet.${labels.min}`)}</span>
            <Input
              value={local.ranges[key].min}
              inputMode={inputMode}
              className="h-8"
              disabled={disabled}
              aria-invalid={msg.invalid || undefined}
              aria-describedby={msg.id}
              onChange={(e) => setRange(key, 'min', e.target.value)}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-muted-foreground text-xs">{t(`filterSheet.${labels.max}`)}</span>
            <Input
              value={local.ranges[key].max}
              inputMode={inputMode}
              className="h-8"
              disabled={disabled}
              aria-invalid={msg.invalid || undefined}
              aria-describedby={msg.id}
              onChange={(e) => setRange(key, 'max', e.target.value)}
            />
          </label>
        </div>
        <Message id={msg.id} error={msg.error} isFirst={msg.isFirst} helper={msg.helper} />
      </div>
    );
  }

  function renderPresetMetric(key: RangeKey, presets: string[]) {
    const label = t(`filterSheet.${METRIC_LABEL_KEYS[key]}`);
    const msg = messageFor(key);
    const labels = RANGE_LABEL_KEYS[key];
    const isCustom = custom[key];
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex flex-wrap items-center gap-1">
          {presets.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="xs"
              disabled={disabled}
              aria-label={`${label} ${preset}`}
              onClick={() => setPreset(key, preset.replace('%', ''))}
            >
              {`\u2265${preset}`}
            </Button>
          ))}
          <Button
            type="button"
            variant={isCustom ? 'secondary' : 'ghost'}
            size="xs"
            disabled={disabled}
            aria-pressed={isCustom}
            aria-label={`${label} ${t('filterSheet.custom')}`}
            onClick={() => toggleCustom(key)}
          >
            {t('filterSheet.custom')}
          </Button>
        </div>
        {isCustom && (
          <div className="flex gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-muted-foreground text-xs">
                {t(`filterSheet.${labels.min}`)}
              </span>
              <Input
                value={local.ranges[key].min}
                inputMode="decimal"
                className="h-8"
                disabled={disabled}
                aria-invalid={msg.invalid || undefined}
                aria-describedby={msg.id}
                onChange={(e) => setRange(key, 'min', e.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-muted-foreground text-xs">
                {t(`filterSheet.${labels.max}`)}
              </span>
              <Input
                value={local.ranges[key].max}
                inputMode="decimal"
                className="h-8"
                disabled={disabled}
                aria-invalid={msg.invalid || undefined}
                aria-describedby={msg.id}
                onChange={(e) => setRange(key, 'max', e.target.value)}
              />
            </label>
          </div>
        )}
        <Message id={msg.id} error={msg.error} isFirst={msg.isFirst} helper={msg.helper} />
      </div>
    );
  }

  const lastTradeCode = errors.lastTradeAfter;
  const lastTradeMsg = {
    id: 'filter-msg-lastTradeAfter',
    invalid: lastTradeCode !== undefined,
    error: lastTradeCode ? t(`filterSheet.${ERROR_LABEL_KEYS[lastTradeCode]}`) : undefined,
    isFirst: firstError === 'lastTradeAfter',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false} disablePointerDismissal>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="overflow-y-auto duration-[180ms] data-[side=right]:w-full motion-reduce:transition-none data-[side=right]:sm:w-[400px] data-[side=right]:sm:max-w-[400px]"
      >
        <div className="flex items-center justify-between gap-2 p-4 pb-0">
          <SheetTitle>{t('filterSheet.title')}</SheetTitle>
          <SheetClose
            render={<Button variant="ghost" size="icon-sm" />}
            aria-label={t('filterSheet.close')}
          >
            <XIcon />
          </SheetClose>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
            <legend className="text-sm font-medium">{t('filterSheet.clusterPerformance')}</legend>
            {renderPair('roi')}
            {renderPair('pnl')}
            {renderPresetMetric('winRate', WIN_RATE_PRESETS)}
            {renderPresetMetric('profitFactor', PROFIT_FACTOR_PRESETS)}
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
            <legend className="text-sm font-medium">{t('filterSheet.clusterScale')}</legend>
            {renderPair('volume')}
            {renderPair('tradeCount')}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">{t('filterSheet.lastTradeLabel')}</span>
              <div className="flex flex-wrap items-center gap-1">
                {LAST_TRADE_PRESETS.map((preset) => (
                  <Button
                    key={preset.key}
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={disabled}
                    aria-label={`${t('filterSheet.lastTradeLabel')} ${t(`filterSheet.${preset.key}`)}`}
                    onClick={() =>
                      setLocal((prev) => ({ ...prev, lastTradeAfter: isoHoursAgo(preset.hours) }))
                    }
                  >
                    {t(`filterSheet.${preset.key}`)}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={custom.lastTradeAfter ? 'secondary' : 'ghost'}
                  size="xs"
                  disabled={disabled}
                  aria-pressed={custom.lastTradeAfter}
                  aria-label={`${t('filterSheet.lastTradeLabel')} ${t('filterSheet.custom')}`}
                  onClick={() => toggleCustom('lastTradeAfter')}
                >
                  {t('filterSheet.custom')}
                </Button>
              </div>
              {custom.lastTradeAfter && (
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">
                    {t('filterSheet.lastTradeAfter')}
                  </span>
                  <Input
                    value={local.lastTradeAfter}
                    className="h-8"
                    disabled={disabled}
                    aria-invalid={lastTradeMsg.invalid || undefined}
                    aria-describedby={lastTradeMsg.id}
                    onChange={(e) =>
                      setLocal((prev) => ({ ...prev, lastTradeAfter: e.target.value }))
                    }
                  />
                </label>
              )}
              <Message
                id={lastTradeMsg.id}
                error={lastTradeMsg.error}
                isFirst={lastTradeMsg.isFirst}
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
            <legend className="text-sm font-medium">{t('filterSheet.clusterBias')}</legend>
            {renderPresetMetric('longWinRate', WIN_RATE_PRESETS_SHORT)}
            {renderPresetMetric('shortWinRate', WIN_RATE_PRESETS_SHORT)}
          </fieldset>

          <SavedSearches
            query={savedSearchQuery}
            onApply={handleApplySavedSearch}
            disabled={disabled}
          />

          <div className="mt-auto flex gap-2">
            <Button type="submit" disabled={disabled}>
              {t('filterSheet.apply')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={handleResetFilters}
            >
              {t('filterSheet.reset')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Message({
  id,
  error,
  isFirst,
  helper,
}: {
  id: string;
  error?: string;
  isFirst: boolean;
  helper?: string;
}) {
  return (
    <p
      id={id}
      role={error && isFirst ? 'alert' : undefined}
      className={cn(
        'min-h-4 text-xs leading-4',
        error ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {error ?? helper}
    </p>
  );
}
