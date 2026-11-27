'use client';

import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
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
  ready: 'text-wallet-ready',
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
}: TraderTableProps) {
  const t = useTranslations('traders');
  const selectedAddresses = selected ?? [];
  const selectionActive = (selected ?? []).length > 0;
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
        className="text-center"
      >
        <button
          type="button"
          onClick={() => onSortChange(column)}
          className="inline-flex w-full items-center justify-center gap-1 hover:underline"
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
        <TableHeader className="bg-surface-secondary static">
          <TableRow>
            {selectable && (
              <TableHead className="bg-surface-secondary text-center">
                <Checkbox
                  aria-label={t('selectAll')}
                  checked={allSelected}
                  onChange={toggleAll}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
            )}
            <TableHead className="bg-card w-10 text-center tabular-nums">
              <span className="sr-only">{t('colRank')}</span>
            </TableHead>
            <TableHead className="bg-surface border-border-subtle sticky left-0 border-r">
              {t('colTrader')}
            </TableHead>
            {SORTABLE_COLUMNS.map((c) => sortableHead(c.key, t(c.labelKey)))}
            <TableHead className="text-center">{t('colProfitFactor')}</TableHead>
            <TableHead className="text-center">{t('colLongShortWr')}</TableHead>
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
                  <TableCell className="text-center">
                    <Checkbox
                      aria-label={t('selectRow', { address: row.wallet_address })}
                      checked={selectedAddresses.includes(row.wallet_address)}
                      onChange={() => toggleOne(row.wallet_address)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                <TableCell className="text-center tabular-nums">{index + 1}</TableCell>
                <TableCell className="bg-surface border-border-subtle sticky left-0 border-r">
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-tertiary text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {firstChar}
                    </div>
                    <div className="min-w-0">
                      {row.display_name && (
                        <div className="truncate font-bold">{row.display_name}</div>
                      )}
                      <div className="text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                        <CopyAddress address={row.wallet_address} />
                        <span
                          role="img"
                          className={cn(
                            'shrink-0 text-xs leading-none',
                            STATUS_CLASSES[row.data_status],
                          )}
                          title={statusLabel}
                          aria-label={statusLabel}
                        >
                          <span aria-hidden="true">●</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    'text-center font-medium tabular-nums opacity-[0.88]',
                    (pnl ?? 0) >= 0 ? 'text-financial-positive' : 'text-destructive',
                  )}
                >
                  {pnl === null || pnl === undefined
                    ? NULL_DISPLAY
                    : `${pnl > 0 ? '+' : ''}${formatUsd(pnl)}`}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {display(formatSignedPercent(row.roi))}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {display(formatPercent(row.win_rate))}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {display(formatUsd(row.volume))}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {display(formatInteger(row.trade_count))}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {display(formatDecimal(row.profit_factor))}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  <LongShortBar longPct={longPct} shortPct={shortPct} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
