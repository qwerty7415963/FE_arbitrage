'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  METRIC_KEYS,
  METRIC_OPERATORS,
  SORT_FIELDS,
  TIMEFRAMES,
  type GroupWalletQuery,
  type MetricFilter,
  type MetricKey,
  type MetricOperator,
  type SortOrder,
  type Timeframe,
  type WalletSortField,
} from '@/types/wallet-scan';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';

export interface ScanFiltersProps {
  query: GroupWalletQuery;
  onChange: (query: GroupWalletQuery) => void;
  onScan: () => void;
  onClear: () => void;
  disabled?: boolean;
}

function parseNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : NaN;
}

function displayNumber(value: number | undefined): string | number {
  return value === undefined || Number.isNaN(value) ? '' : value;
}

export function validateFilters(filters: MetricFilter[]): string | null {
  for (const f of filters) {
    if (f.operator === 'between') {
      if (
        f.min === undefined ||
        f.max === undefined ||
        Number.isNaN(f.min) ||
        Number.isNaN(f.max)
      ) {
        return 'invalidNumber';
      }
      if (f.min > f.max) {
        return 'minGreaterThanMax';
      }
    } else if (f.value === undefined || Number.isNaN(f.value)) {
      return 'invalidNumber';
    }
  }
  return null;
}

export function ScanFilters({ query, onChange, onScan, onClear, disabled }: ScanFiltersProps) {
  const filters = query.filters ?? [];

  function setQuery(patch: Partial<GroupWalletQuery>) {
    onChange({ ...query, ...patch });
  }

  function addFilter() {
    onChange({
      ...query,
      filters: [...filters, { metric: 'pnl', operator: 'gt', value: undefined }],
    });
  }

  function updateFilter(index: number, patch: Partial<MetricFilter>) {
    onChange({
      ...query,
      filters: filters.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    });
  }

  function removeFilter(index: number) {
    onChange({ ...query, filters: filters.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Search</span>
          <Input
            value={query.search ?? ''}
            onChange={(e) => setQuery({ search: e.target.value })}
            placeholder="address or tag"
            className="w-48"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Timeframe</span>
          <select
            value={query.timeframe ?? '30D'}
            onChange={(e) => setQuery({ timeframe: e.target.value as Timeframe })}
            className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
            disabled={disabled}
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">DEX (csv)</span>
          <Input
            value={(query.dex ?? []).join(',')}
            onChange={(e) =>
              setQuery({
                dex: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="hyperliquid,extended"
            className="w-44"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Sort</span>
          <select
            value={query.sort ?? 'pnl'}
            onChange={(e) => setQuery({ sort: e.target.value as WalletSortField })}
            className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
            disabled={disabled}
          >
            {SORT_FIELDS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Order</span>
          <select
            value={query.order ?? 'desc'}
            onChange={(e) => setQuery({ order: e.target.value as SortOrder })}
            className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
            disabled={disabled}
          >
            <option value="desc">desc</option>
            <option value="asc">asc</option>
          </select>
        </label>

        <Button variant="outline" size="sm" onClick={addFilter} disabled={disabled}>
          <PlusIcon className="mr-1 h-4 w-4" />
          Filter
        </Button>

        <Button onClick={onScan} disabled={disabled}>
          <SearchIcon className="mr-2 h-4 w-4" />
          Scan
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
          Clear
        </Button>
      </div>

      {filters.map((f, i) => (
        <div key={i} className="bg-muted/40 flex flex-wrap items-end gap-2 rounded-md p-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Metric</span>
            <select
              value={f.metric}
              onChange={(e) => updateFilter(i, { metric: e.target.value as MetricKey })}
              className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
              disabled={disabled}
            >
              {METRIC_KEYS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Operator</span>
            <select
              value={f.operator}
              onChange={(e) => updateFilter(i, { operator: e.target.value as MetricOperator })}
              className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
              disabled={disabled}
            >
              {METRIC_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>

          {f.operator === 'between' ? (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Min</span>
                <Input
                  inputMode="decimal"
                  value={displayNumber(f.min)}
                  onChange={(e) => updateFilter(i, { min: parseNumber(e.target.value) })}
                  className="w-28"
                  disabled={disabled}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Max</span>
                <Input
                  inputMode="decimal"
                  value={displayNumber(f.max)}
                  onChange={(e) => updateFilter(i, { max: parseNumber(e.target.value) })}
                  className="w-28"
                  disabled={disabled}
                />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Value</span>
              <Input
                inputMode="decimal"
                value={displayNumber(f.value)}
                onChange={(e) => updateFilter(i, { value: parseNumber(e.target.value) })}
                className="w-28"
                disabled={disabled}
              />
            </label>
          )}

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeFilter(i)}
            disabled={disabled}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
