'use client';

import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatSignedPercent,
  formatUsd,
} from '@/lib/trader-format';
import type {
  DataStatus,
  PeriodMetrics,
  SortDirection,
  TraderPeriod,
  TraderSortBy,
} from '@/types/trader';
import { DEFAULT_TRADER_PERIOD } from '@/types/trader';
import { fetchTraderDetail } from '@/services/traders';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, EyeIcon, UserPlusIcon } from 'lucide-react';
import { CopyAddress } from './copy-address';
import { LongShortBar } from './long-short-bar';

export const NULL_DISPLAY = '—';

function display(value: string | null): string {
  return value ?? NULL_DISPLAY;
}

const SORTABLE_COLUMNS: Array<{ key: TraderSortBy; labelKey: string }> = [
  { key: 'pnl', labelKey: 'colPnl' },
  { key: 'roi', labelKey: 'colRoi' },
  { key: 'win_rate', labelKey: 'colWinRate' },
  { key: 'volume', labelKey: 'colVolume' },
  { key: 'trade_count', labelKey: 'colTrades' },
];

const STATUS_LABEL_KEYS: Record<DataStatus, string> = {
  ready: 'statusReady',
  syncing: 'statusSyncing',
  stale: 'statusStale',
  error: 'statusError',
};

const STATUS_CLASSES: Record<DataStatus, string> = {
  ready: 'text-primary',
  syncing: 'text-muted-foreground',
  stale: 'text-freshness',
  error: 'text-destructive',
};

export interface TraderTableProps {
  rows: PeriodMetrics[];
  period?: TraderPeriod;
  queryClient?: QueryClient;
  sortBy: TraderSortBy;
  sortDirection: SortDirection;
  onSortChange: (sortBy: TraderSortBy) => void;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (addresses: string[]) => void;
  onView?: (row: PeriodMetrics) => void;
  onAdd?: (row: PeriodMetrics) => void;
}

export function TraderTable({
  rows,
  period,
  queryClient,
  sortBy,
  sortDirection,
  onSortChange,
  selectable,
  selected,
  onSelect,
  onView,
  onAdd,
}: TraderTableProps) {
  const t = useTranslations('traders');
  const selectedAddresses = selected ?? [];
  let qc: QueryClient | undefined = queryClient;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    qc = qc ?? useQueryClient();
  } catch {
    // no provider (tests) -> prefetch skipped
  }

  function toggleAll(): void {
    if (!onSelect) return;
    const allSelected =
      rows.length > 0 && rows.every((r) => selectedAddresses.includes(r.wallet_address));
    onSelect(allSelected ? [] : rows.map((r) => r.wallet_address));
  }

  function toggleOne(address: string): void {
    if (!onSelect) return;
    onSelect(
      selectedAddresses.includes(address)
        ? selectedAddresses.filter((a) => a !== address)
        : [...selectedAddresses, address],
    );
  }

  function sortIndicator(column: TraderSortBy) {
    if (column !== sortBy) return <ArrowUpDownIcon className="h-3.5 w-3.5" aria-hidden />;
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <ArrowDownIcon className="h-3.5 w-3.5" aria-hidden />
    );
  }

  function sortableHead(column: TraderSortBy, label: string) {
    const active = column === sortBy;
    return (
      <TableHead
        key={column}
        aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        className="text-right"
      >
        <button
          type="button"
          onClick={() => onSortChange(column)}
          className="inline-flex w-full items-center justify-end gap-1 hover:underline"
        >
          {label}
          {sortIndicator(column)}
        </button>
      </TableHead>
    );
  }

  const allSelected =
    rows.length > 0 && rows.every((r) => selectedAddresses.includes(r.wallet_address));

  return (
    <div className="relative w-full touch-manipulation">
      <Table>
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow>
            {selectable && (
              <TableHead className="bg-card">
                <input
                  type="checkbox"
                  aria-label={t('selectAll')}
                  checked={allSelected}
                  onChange={toggleAll}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 md:focus:opacity-100"
                />
              </TableHead>
            )}
            <TableHead className="bg-card w-10 text-right tabular-nums">
              <span className="sr-only">{t('colRank')}</span>
            </TableHead>
            <TableHead className="bg-card sticky left-0 border-r shadow-sm">
              {t('colTrader')}
            </TableHead>
            {SORTABLE_COLUMNS.map((c) => sortableHead(c.key, t(c.labelKey)))}
            <TableHead className="text-right">{t('colProfitFactor')}</TableHead>
            <TableHead className="text-right">{t('colLongShortWr')}</TableHead>
            {(onView || onAdd) && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const pnl = row.pnl;
            const statusLabel = t(STATUS_LABEL_KEYS[row.data_status]);
            const longShortTotal = (row.long_count ?? 0) + (row.short_count ?? 0);
            const longPct =
              longShortTotal === 0
                ? null
                : Math.round(((row.long_count ?? 0) / longShortTotal) * 100);
            const shortPct =
              longShortTotal === 0
                ? null
                : Math.round(((row.short_count ?? 0) / longShortTotal) * 100);
            const firstChar = (row.display_name || row.wallet_address || '?')
              .charAt(0)
              .toUpperCase();
            return (
              <TableRow
                key={`${row.venue}:${row.wallet_address}`}
                tabIndex={0}
                className={cn(
                  'group hover:bg-muted/40 cursor-pointer touch-manipulation transition-colors select-none',
                )}
                onClick={() => onView?.(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView?.(row);
                  }
                }}
                onMouseEnter={() => {
                  if (!qc) return;
                  if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches)
                    return;
                  const wallet = row.wallet_address.toLowerCase();
                  const p = period ?? DEFAULT_TRADER_PERIOD;
                  void qc.prefetchQuery({
                    queryKey: ['trader-detail', wallet, p],
                    queryFn: () => fetchTraderDetail(wallet, { period: p }),
                  });
                }}
              >
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={t('selectRow', { address: row.wallet_address })}
                      checked={selectedAddresses.includes(row.wallet_address)}
                      onChange={() => toggleOne(row.wallet_address)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 md:focus:opacity-100"
                    />
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">{index + 1}</TableCell>
                <TableCell className="bg-card sticky left-0 border-r shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                      {firstChar}
                    </div>
                    <div className="min-w-0">
                      {row.display_name && (
                        <div className="truncate font-bold">{row.display_name}</div>
                      )}
                      <div className="text-muted-foreground">
                        <CopyAddress address={row.wallet_address} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span
                      role="img"
                      className={cn('text-xs', STATUS_CLASSES[row.data_status])}
                      title={statusLabel}
                      aria-label={statusLabel}
                    >
                      <span aria-hidden="true">●</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    (pnl ?? 0) >= 0 ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {pnl === null || pnl === undefined
                    ? NULL_DISPLAY
                    : `${pnl > 0 ? '+' : ''}${formatUsd(pnl)}`}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {display(formatSignedPercent(row.roi))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {display(formatPercent(row.win_rate))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {display(formatUsd(row.volume))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {display(formatInteger(row.trade_count))}
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
                  {display(formatDecimal(row.profit_factor))}
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
                  <LongShortBar longPct={longPct} shortPct={shortPct} />
                </TableCell>
                {(onView || onAdd) && (
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <div className="flex justify-end gap-1">
                      {onView && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(row);
                          }}
                          aria-label={t('view')}
                        >
                          <EyeIcon className="h-4 w-4" aria-hidden />
                          {t('view')}
                        </Button>
                      )}
                      {onAdd && (
                        <button
                          type="button"
                          className="hover:bg-muted rounded p-1 opacity-100 transition-opacity md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:focus:pointer-events-auto md:focus:opacity-100"
                          aria-label={t('addToGroup')}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdd(row);
                          }}
                        >
                          <UserPlusIcon className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
