'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
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
  formatRelativeTime,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import type { PositionSnapshot, PositionSortKey, SortDirection } from '@/types/trader';
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-react';

const STATUS_LABEL_KEYS = {
  ready: 'statusReady',
  error: 'positionsError',
} as const;

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
          <div className="bg-muted h-6 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
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
  const summary = snapshot?.summary ?? null;
  // Live detail (contract v1.2 §1.1): ready|error only, never syncing/stale.
  const status: keyof typeof STATUS_LABEL_KEYS = snapshot?.data_status ?? 'ready';
  const asOf = snapshot?.as_of ?? summary?.as_of ?? null;

  return (
    <section aria-label={t('openPositions')} className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">{t('openPositions')}</h2>
      <p className="text-muted-foreground text-xs">
        {t(STATUS_LABEL_KEYS[status])}
        {asOf && ` · ${t('positionsAsOf', { time: formatRelativeTime(asOf) ?? '' })}`}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <span className="text-muted-foreground text-xs">{t('accountValue')}</span>
          <span className="block text-lg font-semibold">
            {summary?.account_value === null || summary?.account_value === undefined
              ? '—'
              : formatUsdOrDash(summary.account_value)}
          </span>
        </div>
        <div className="rounded-lg border p-3">
          <span className="text-muted-foreground text-xs">{t('totalNotional')}</span>
          <span className="block text-lg font-semibold">
            {summary?.total_ntl_pos === null || summary?.total_ntl_pos === undefined
              ? '—'
              : formatUsdOrDash(summary.total_ntl_pos)}
          </span>
        </div>
        <div className="rounded-lg border p-3">
          <span className="text-muted-foreground text-xs">{t('totalMargin')}</span>
          <span className="block text-lg font-semibold">
            {summary?.total_margin_used === null || summary?.total_margin_used === undefined
              ? '—'
              : formatUsdOrDash(summary.total_margin_used)}
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noOpenPositions')}</p>
      ) : (
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
              {sortableHead('leverage', t('leverage'))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((p) => {
              const tone = activitySideTone(p.side);
              const upnl = p.unrealized_pnl;
              return (
                <TableRow key={p.coin}>
                  <TableCell className="font-medium">{p.coin}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium',
                        tone === 'positive'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {t(p.side === 'LONG' ? 'long' : 'short')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(p.size)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.entry_price === null ? '—' : formatUsdOrDash(p.entry_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.mark_price === null ? '—' : formatUsdOrDash(p.mark_price)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums',
                      upnl !== null && upnl !== 0
                        ? upnl > 0
                          ? 'text-primary'
                          : 'text-destructive'
                        : undefined,
                    )}
                  >
                    {upnl === null ? '—' : formatSignedUsd(upnl)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.return_on_equity === null ? '—' : formatSignedPct(p.return_on_equity * 100)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.liquidation_price === null ? '—' : formatUsdOrDash(p.liquidation_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.leverage === null ? '—' : `${formatNumber(p.leverage, 2)}x`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
