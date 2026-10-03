'use client';

import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deriveWinRate,
  formatDateTimeUtc,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatRelativeTime,
  formatSignedPercent,
  formatUsd,
} from '@/lib/trader-format';
import type { DataStatus, PeriodMetrics, SortDirection, TraderSortBy } from '@/types/trader';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import { CopyAddress } from './copy-address';

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
  { key: 'last_trade', labelKey: 'colLastTrade' },
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
  stale: 'text-amber-600 dark:text-amber-500',
  error: 'text-destructive',
};

export interface TraderTableProps {
  rows: PeriodMetrics[];
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
      >
        <button
          type="button"
          onClick={() => onSortChange(column)}
          className="inline-flex items-center gap-1 hover:underline"
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead>
                <input
                  type="checkbox"
                  aria-label={t('selectAll')}
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4"
                />
              </TableHead>
            )}
            <TableHead className="bg-background sticky left-0">{t('colTrader')}</TableHead>
            {SORTABLE_COLUMNS.filter((c) => c.key !== 'last_trade').map((c) =>
              sortableHead(c.key, t(c.labelKey)),
            )}
            <TableHead>{t('colProfitFactor')}</TableHead>
            <TableHead>{t('colLongShortWr')}</TableHead>
            {sortableHead('last_trade', t('colLastTrade'))}
            <TableHead>{t('colData')}</TableHead>
            {(onView || onAdd) && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const pnl = row.pnl;
            const longWr = deriveWinRate(row.long_wins, row.long_count);
            const shortWr = deriveWinRate(row.short_wins, row.short_count);
            return (
              <TableRow key={`${row.venue}:${row.wallet_address}`}>
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={t('selectRow', { address: row.wallet_address })}
                      checked={selectedAddresses.includes(row.wallet_address)}
                      onChange={() => toggleOne(row.wallet_address)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                )}
                <TableCell className="bg-background sticky left-0">
                  {row.display_name && <div className="font-medium">{row.display_name}</div>}
                  <CopyAddress address={row.wallet_address} />
                </TableCell>
                <TableCell className={(pnl ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}>
                  {pnl === null || pnl === undefined
                    ? NULL_DISPLAY
                    : `${pnl > 0 ? '+' : ''}${formatUsd(pnl)}`}
                </TableCell>
                <TableCell>{display(formatSignedPercent(row.roi))}</TableCell>
                <TableCell>{display(formatPercent(row.win_rate))}</TableCell>
                <TableCell>{display(formatUsd(row.volume))}</TableCell>
                <TableCell>{display(formatInteger(row.trade_count))}</TableCell>
                <TableCell>{display(formatDecimal(row.profit_factor))}</TableCell>
                <TableCell>
                  {display(formatPercent(longWr))} / {display(formatPercent(shortWr))}
                </TableCell>
                <TableCell
                  className="text-xs"
                  title={formatDateTimeUtc(row.last_trade_at) ?? undefined}
                >
                  {display(formatRelativeTime(row.last_trade_at))}
                </TableCell>
                <TableCell className={STATUS_CLASSES[row.data_status]}>
                  {t(STATUS_LABEL_KEYS[row.data_status])}
                </TableCell>
                {(onView || onAdd) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onView && (
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs hover:underline"
                          onClick={() => onView(row)}
                        >
                          {t('viewDetail')}
                        </button>
                      )}
                      {onAdd && (
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs hover:underline"
                          onClick={() => onAdd(row)}
                        >
                          {t('addToGroup')}
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
