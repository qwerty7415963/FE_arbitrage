'use client';

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
  formatInteger,
  formatNumber,
  formatRelativeTime,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import { useTraderFills } from '@/hooks/use-trader-fills';

export interface FillsSectionProps {
  walletAddress: string;
  enabled?: boolean;
}

export function FillsSection({ walletAddress, enabled = true }: FillsSectionProps) {
  const t = useTranslations('traders');
  const { fills, isLoading, error, fetchNextPage, refetch, hasMore, isFetchingNextPage } =
    useTraderFills(walletAddress, { enabled });

  if (isLoading && fills.length === 0) {
    return (
      <section aria-label={t('tabFills')} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && fills.length === 0) {
    return (
      <section aria-label={t('tabFills')} className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  if (fills.length === 0) {
    return (
      <section aria-label={t('tabFills')} className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{t('noFills')}</p>
      </section>
    );
  }

  return (
    <section aria-label={t('tabFills')} className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('coin')}</TableHead>
              <TableHead>{t('side')}</TableHead>
              <TableHead>{t('colDir')}</TableHead>
              <TableHead className="text-right">{t('size')}</TableHead>
              <TableHead className="text-right">{t('colPrice')}</TableHead>
              <TableHead className="text-right">{t('colClosedPnl')}</TableHead>
              <TableHead className="text-right">{t('colFee')}</TableHead>
              <TableHead className="text-right">{t('colTime')}</TableHead>
              <TableHead className="text-right">TID</TableHead>
              <TableHead className="text-right">{t('colOid')}</TableHead>
              <TableHead className="text-right">{t('colCrossed')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fills.map((fill) => {
              const tone = activitySideTone(fill.side);
              return (
                <TableRow key={fill.tid}>
                  <TableCell className="font-medium">{fill.coin}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium',
                        tone === 'positive'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {t(fill.side === 'BUY' ? 'buy' : 'sell')}
                    </span>
                  </TableCell>
                  <TableCell>{fill.dir}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(fill.size)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsd(fill.price) ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSignedUsd(fill.closed_pnl)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSignedUsd(fill.fee)} {fill.fee_token}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    title={formatDateTimeUtc(fill.time) ?? undefined}
                  >
                    {formatRelativeTime(fill.time) ?? fill.time}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInteger(fill.tid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInteger(fill.oid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fill.crossed ? t('yes') : t('no')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
