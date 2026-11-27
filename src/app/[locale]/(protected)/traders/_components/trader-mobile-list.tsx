'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatSignedPercent,
  formatUsd,
} from '@/lib/trader-format';
import type { PeriodMetrics, TraderSortBy, SortDirection } from '@/types/trader';
import { CopyAddress } from '@/components/shared/traders/copy-address';

interface TraderMobileListProps {
  rows: PeriodMetrics[];
  period: string;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (addresses: string[]) => void;
  onView?: (row: PeriodMetrics) => void;
  onAdd?: (row: PeriodMetrics) => void;
}

export function TraderMobileList({
  rows,
  selectable,
  selected = [],
  onSelect,
  onView,
  onAdd,
}: TraderMobileListProps) {
  const t = useTranslations('traders');
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  const selectedSet = new Set(selected);

  function toggleOne(address: string) {
    if (!onSelect) return;
    onSelect(
      selectedSet.has(address) ? selected.filter((a) => a !== address) : [...selected, address],
    );
  }

  return (
    <ul className="flex flex-col gap-2 lg:hidden" aria-label={t('title')}>
      {rows.map((row, index) => {
        const pnl = row.pnl;
        const pnlTone = (pnl ?? 0) >= 0 ? 'text-financial-positive' : 'text-destructive';
        const selectedRow = selectedSet.has(row.wallet_address);
        return (
          <li key={`${row.venue}:${row.wallet_address}`}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onView?.(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onView?.(row);
                }
              }}
              className={cn(
                'bg-surface border-border-subtle flex touch-manipulation flex-col gap-2 rounded-xl border p-3',
                selectedRow && 'border-primary bg-primary-subtle',
              )}
            >
              <div className="flex items-center gap-3">
                {selectable && (
                  <Checkbox
                    aria-label={t('selectRow', { address: row.wallet_address })}
                    checked={selectedRow}
                    onChange={() => toggleOne(row.wallet_address)}
                    onClick={(e) => e.stopPropagation()}
                    className="size-5"
                  />
                )}
                <span className="text-muted-foreground w-6 shrink-0 text-right text-xs tabular-nums">
                  {index + 1}
                </span>
                <div className="bg-surface-tertiary text-text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {(row.display_name || row.wallet_address || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {row.display_name && (
                    <div className="truncate font-semibold">{row.display_name}</div>
                  )}
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <CopyAddress address={row.wallet_address} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className={cn('text-base font-semibold tabular-nums', pnlTone)}>
                    {pnl === null || pnl === undefined
                      ? '—'
                      : `${pnl > 0 ? '+' : ''}${formatUsd(pnl)}`}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatSignedPercent(row.roi)}
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
                <span>
                  {t('colWinRate')}: {formatPercent(row.win_rate) ?? '—'}
                </span>
                <span>
                  {t('colVolume')}: {formatUsd(row.volume) ?? '—'}
                </span>
                <span>
                  {t('colTrades')}: {formatInteger(row.trade_count) ?? '—'}
                </span>
                <span>
                  {t('colProfitFactor')}: {formatDecimal(row.profit_factor) ?? '—'}
                </span>
              </div>
              {(onView || onAdd) && (
                <div className="flex justify-end gap-2">
                  {onAdd && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(row);
                      }}
                    >
                      <span className="sr-only">{t('addToGroup')}</span>+
                    </Button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
