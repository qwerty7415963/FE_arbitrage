'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  activitySideTone,
  formatDateTimeUtc,
  formatDurationSec,
  formatRelativeTime,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import {
  DEFAULT_ACTIVITY_DIR,
  DEFAULT_ACTIVITY_SORT,
  type ActivityResultFilter,
  type ActivitySideFilter,
  type ActivitySortKey,
  type SortDirection,
} from '@/types/trader';
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-react';

export interface TradesSectionProps {
  walletAddress: string;
  enabled?: boolean;
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <ArrowUpDownIcon className="h-3.5 w-3.5" aria-hidden />;
  return dir === 'asc' ? (
    <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowDownIcon className="h-3.5 w-3.5" aria-hidden />
  );
}

export function TradesSection({ walletAddress, enabled = true }: TradesSectionProps) {
  const t = useTranslations('traders');
  const [sort, setSort] = useState<ActivitySortKey>(DEFAULT_ACTIVITY_SORT);
  const [dir, setDir] = useState<SortDirection>(DEFAULT_ACTIVITY_DIR);
  const [result, setResult] = useState<ActivityResultFilter>('all');
  const [side, setSide] = useState<ActivitySideFilter>('all');

  const { trades, counts, isLoading, error, fetchNextPage, refetch, hasMore, isFetchingNextPage } =
    useTraderTrades(walletAddress, { sort, dir, result, side, enabled });

  function handleSort(next: ActivitySortKey) {
    if (next === sort) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(next);
      setDir('desc');
    }
  }

  function sortableHead(sortKey: ActivitySortKey, label: string) {
    const active = sort === sortKey;
    return (
      <TableHead
        key={sortKey}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className="text-right"
      >
        <button
          type="button"
          onClick={() => handleSort(sortKey)}
          className="inline-flex w-full items-center justify-end gap-1 hover:underline"
        >
          {label}
          <SortIndicator active={active} dir={dir} />
        </button>
      </TableHead>
    );
  }

  if (isLoading && trades.length === 0) {
    return (
      <section aria-label={t('tabTrades')} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && trades.length === 0) {
    return (
      <section aria-label={t('tabTrades')} className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  const resultChips: { value: ActivityResultFilter; label: string; count: number | null }[] = [
    { value: 'all', label: t('chipAll'), count: counts?.total ?? null },
    { value: 'win', label: t('chipWin'), count: counts?.win ?? null },
    { value: 'loss', label: t('chipLoss'), count: counts?.loss ?? null },
  ];
  const sideChips: { value: ActivitySideFilter; label: string; count: number | null }[] = [
    { value: 'all', label: t('chipAll'), count: counts?.total ?? null },
    { value: 'long', label: t('chipLong'), count: counts?.long ?? null },
    { value: 'short', label: t('chipShort'), count: counts?.short ?? null },
  ];

  return (
    <section aria-label={t('tabTrades')} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('colStatus')}>
        <div className="flex gap-1" role="group" aria-label="result">
          {resultChips.map((chip) => (
            <Button
              key={chip.value}
              variant={result === chip.value ? 'default' : 'outline'}
              size="sm"
              aria-pressed={result === chip.value}
              onClick={() => setResult(chip.value)}
            >
              {chip.label}
              {chip.count !== null && ` (${chip.count})`}
            </Button>
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label="side">
          {sideChips.map((chip) => (
            <Button
              key={chip.value}
              variant={side === chip.value ? 'default' : 'outline'}
              size="sm"
              aria-pressed={side === chip.value}
              onClick={() => setSide(chip.value)}
            >
              {chip.label}
              {chip.count !== null && ` (${chip.count})`}
            </Button>
          ))}
        </div>
      </div>

      {trades.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noTrades')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {sortableHead('market', t('colAsset'))}
                <TableHead>{t('side')}</TableHead>
                {sortableHead('entry_price', t('colEntry'))}
                {sortableHead('exit_price', t('colExit'))}
                {sortableHead('volume', t('colNotional'))}
                {sortableHead('duration', t('colDuration'))}
                <TableHead className="text-right">{t('colFunding')}</TableHead>
                {sortableHead('net_pnl', t('netPnl'))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => {
                const tone = activitySideTone(trade.side);
                const entryPrice = trade.entry_price ?? null;
                const exitPrice = trade.exit_price ?? null;
                return (
                  <TableRow key={`${trade.market}-${trade.opened_at}-${trade.closed_at}`}>
                    <TableCell className="font-medium">{trade.market}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          tone === 'positive'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {t(trade.side === 'LONG' ? 'long' : 'short')}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      title={formatDateTimeUtc(trade.opened_at) ?? undefined}
                    >
                      <span className="block">
                        {entryPrice === null ? '—' : (formatUsd(entryPrice) ?? '—')}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {formatRelativeTime(trade.opened_at) ?? trade.opened_at}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      title={formatDateTimeUtc(trade.closed_at) ?? undefined}
                    >
                      <span className="block">
                        {exitPrice === null ? '—' : (formatUsd(exitPrice) ?? '—')}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {formatRelativeTime(trade.closed_at) ?? trade.closed_at}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUsd(trade.volume) ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDurationSec(trade.duration_sec)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums',
                        trade.net_pnl > 0
                          ? 'text-primary'
                          : trade.net_pnl < 0
                            ? 'text-destructive'
                            : undefined,
                      )}
                    >
                      {formatSignedUsd(trade.net_pnl)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {t('loadMore')}
        </Button>
      )}
    </section>
  );
}
