'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { AssetIcon } from '@/components/shared/asset-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { stripDexPrefix } from '@/lib/asset-meta';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  activitySideTone,
  formatNumber,
  formatSignedPct,
  formatSignedUsd,
  formatTpSlList,
  formatUsd,
} from '@/lib/trader-format';
import type { PositionSnapshot, PositionSortKey, SortDirection } from '@/types/trader';
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-react';

export interface PositionsSectionProps {
  snapshot: PositionSnapshot | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  sort?: PositionSortKey;
  dir?: SortDirection;
  onSortChange?: (sort: PositionSortKey) => void;
}

function formatUsdOrDash(value: number | null): string {
  return formatUsd(value) ?? '—';
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <ArrowUpDownIcon className="h-3.5 w-3.5" aria-hidden />;
  return dir === 'asc' ? (
    <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowDownIcon className="h-3.5 w-3.5" aria-hidden />
  );
}

export function PositionsSection({
  snapshot,
  isLoading,
  error,
  onRetry,
  sort,
  dir = 'asc',
  onSortChange,
}: PositionsSectionProps) {
  const t = useTranslations('traders');

  function sortableHead(
    sortKey: PositionSortKey,
    label: string,
    align: 'left' | 'right' = 'right',
  ) {
    const active = sort === sortKey;
    const content = (
      <span
        className={
          align === 'right'
            ? 'inline-flex w-full items-center justify-end gap-1'
            : 'inline-flex items-center gap-1'
        }
      >
        {label}
        <SortIndicator active={active} dir={dir} />
      </span>
    );
    return (
      <TableHead
        key={sortKey}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={align === 'right' ? 'text-right' : undefined}
      >
        {onSortChange ? (
          <button
            type="button"
            onClick={() => onSortChange(sortKey)}
            className="w-full hover:underline"
          >
            {content}
          </button>
        ) : (
          content
        )}
      </TableHead>
    );
  }

  if (isLoading && !snapshot) {
    return (
      <section aria-label={t('openPositions')}>
        <h2 className="text-sm font-semibold">{t('openPositions')}</h2>
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && !snapshot) {
    return (
      <section aria-label={t('openPositions')}>
        <h2 className="text-sm font-semibold">{t('openPositions')}</h2>
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="border-input bg-background mt-2 rounded-md border px-3 py-1 text-sm"
        >
          {t('retry')}
        </button>
      </section>
    );
  }

  const positions = snapshot?.positions ?? [];
  // Live detail (contract v1.2 §1.1): ready|error only, never syncing/stale.
  const status = snapshot?.data_status ?? 'ready';

  const longCount = positions.filter((p) => p.side === 'LONG').length;
  let totalValue = 0;
  let longValue = 0;
  let valuedCount = 0;
  for (const p of positions) {
    if (p.position_value === null || p.position_value === undefined) continue;
    totalValue += p.position_value;
    valuedCount += 1;
    if (p.side === 'LONG') longValue += p.position_value;
  }
  const longPct =
    positions.length === 0
      ? 0
      : valuedCount > 0 && totalValue > 0
        ? Math.round((longValue / totalValue) * 100)
        : Math.round((longCount / positions.length) * 100);
  const leverages = positions
    .map((p) => p.leverage)
    .filter((value): value is number => value !== null && value !== undefined);
  const positionLeverage =
    leverages.length === 0
      ? '—'
      : formatNumber(
          positions.length === 1
            ? leverages[0]
            : leverages.reduce((sum, value) => sum + value, 0) / leverages.length,
          2,
        );

  return (
    <section aria-label={t('openPositions')} className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">{t('openPositions')}</h2>
      <p className="text-muted-foreground text-[13px]">
        {t.rich('positionsContext', {
          count: positions.length,
          longPct,
          lev: positionLeverage,
          strong: (chunks) => <span className="text-foreground font-medium">{chunks}</span>,
        })}
      </p>
      {status === 'error' && <p className="text-destructive text-xs">{t('statusError')}</p>}

      {positions.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noOpenPositions')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {sortableHead('coin', t('coin'), 'left')}
                <TableHead>{t('side')}</TableHead>
                {sortableHead('size', t('size'))}
                {sortableHead('entry_price', t('entryPrice'))}
                {sortableHead('mark_price', t('markPrice'))}
                {sortableHead('unrealized_pnl', t('unrealizedPnl'))}
                {sortableHead('return_on_equity', t('roi'))}
                <TableHead className="text-right">{t('liquidationPrice')}</TableHead>
                <TableHead className="text-right">{t('tp')}</TableHead>
                <TableHead className="text-right">{t('sl')}</TableHead>
                {sortableHead('leverage', t('leverage'))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((p) => {
                const tone = activitySideTone(p.side);
                const upnl = p.unrealized_pnl;
                return (
                  <TableRow key={p.coin}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <AssetIcon symbol={p.coin} size={14} />
                        {stripDexPrefix(p.coin)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          tone === 'positive'
                            ? 'bg-direction-long/10 text-direction-long'
                            : 'bg-direction-short/10 text-direction-short',
                        )}
                      >
                        {t(p.side === 'LONG' ? 'long' : 'short')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(p.size)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.entry_price === null ? '—' : formatUsdOrDash(p.entry_price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.mark_price === null ? '—' : formatUsdOrDash(p.mark_price)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium tabular-nums opacity-[0.88]',
                        upnl !== null && upnl !== 0
                          ? upnl > 0
                            ? 'text-financial-positive'
                            : 'text-destructive'
                          : undefined,
                      )}
                    >
                      {upnl === null ? '—' : formatSignedUsd(upnl)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.return_on_equity === null
                        ? '—'
                        : formatSignedPct(p.return_on_equity * 100)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.liquidation_price === null ? '—' : formatUsdOrDash(p.liquidation_price)}
                    </TableCell>
                    {(() => {
                      const tpPxs = p.tp_pxs ?? [];
                      const tp = formatTpSlList(tpPxs);
                      return (
                        <TableCell className="text-right tabular-nums">
                          <span title={tp.title ?? undefined}>{tp.text}</span>
                        </TableCell>
                      );
                    })()}
                    {(() => {
                      const slPxs = p.sl_pxs ?? [];
                      const sl = formatTpSlList(slPxs);
                      return (
                        <TableCell className="text-right tabular-nums">
                          <span title={sl.title ?? undefined}>{sl.text}</span>
                        </TableCell>
                      );
                    })()}
                    <TableCell className="text-right tabular-nums">
                      {p.leverage === null ? '—' : `${formatNumber(p.leverage, 2)}x`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
