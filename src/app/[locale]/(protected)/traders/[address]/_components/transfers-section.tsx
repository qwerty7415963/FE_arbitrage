'use client';

import { useTranslations } from 'next-intl';
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
  formatDateTimeUtc,
  formatNumber,
  formatRelativeTime,
  formatUsd,
  shortAddress,
} from '@/lib/trader-format';
import { useTraderTransfers } from '@/hooks/use-trader-transfers';

export interface TransfersSectionProps {
  walletAddress: string;
  enabled?: boolean;
}

function usd(value: number | null | undefined): string {
  return formatUsd(value) ?? '—';
}

export function TransfersSection({ walletAddress, enabled = true }: TransfersSectionProps) {
  const t = useTranslations('traders');
  const { transfers, isLoading, error, fetchNextPage, refetch, hasMore, isFetchingNextPage } =
    useTraderTransfers(walletAddress, { enabled });

  if (isLoading && transfers.length === 0) {
    return (
      <section aria-label={t('tabTransfers')} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && transfers.length === 0) {
    return (
      <section aria-label={t('tabTransfers')} className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  if (transfers.length === 0) {
    return (
      <section aria-label={t('tabTransfers')} className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{t('noTransfers')}</p>
      </section>
    );
  }

  return (
    <section aria-label={t('tabTransfers')} className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{t('colTime')}</TableHead>
              <TableHead>{t('colHash')}</TableHead>
              <TableHead>{t('colType')}</TableHead>
              <TableHead className="text-right">{t('colUsdc')}</TableHead>
              <TableHead>{t('colToken')}</TableHead>
              <TableHead className="text-right">{t('colAmount')}</TableHead>
              <TableHead className="text-right">{t('colUsdcValue')}</TableHead>
              <TableHead>{t('colCounterparty')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((row) => (
              <TableRow key={`${row.time}-${row.hash}`}>
                <TableCell
                  className="text-right tabular-nums"
                  title={formatDateTimeUtc(row.time) ?? undefined}
                >
                  {formatRelativeTime(row.time) ?? row.time}
                </TableCell>
                <TableCell className="font-mono text-xs" title={row.hash}>
                  {shortAddress(row.hash)}
                </TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(row.usdc)}</TableCell>
                <TableCell>{row.token ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.amount === null ? '—' : formatNumber(row.amount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{usd(row.usdc_value)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {row.counterparty ? shortAddress(row.counterparty) : '—'}
                </TableCell>
              </TableRow>
            ))}
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
