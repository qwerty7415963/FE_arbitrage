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
import { formatNumber, formatRelativeTime, formatUsd } from '@/lib/trader-format';
import { useTraderBalances } from '@/hooks/use-trader-balances';

export interface BalancesSectionProps {
  walletAddress: string;
  enabled?: boolean;
}

function usd(value: number | null | undefined): string {
  return formatUsd(value) ?? '—';
}

export function BalancesSection({ walletAddress, enabled = true }: BalancesSectionProps) {
  const t = useTranslations('traders');
  const { balances, isLoading, error, refetch } = useTraderBalances(walletAddress, { enabled });

  if (isLoading && !balances) {
    return (
      <section aria-label={t('tabBalances')} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && !balances) {
    return (
      <section aria-label={t('tabBalances')} className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  const perp = balances?.perp ?? null;
  const spot = balances?.spot ?? null;
  const status = balances?.data_status ?? 'syncing';
  const asOf = perp?.as_of ?? spot?.as_of ?? null;

  if (!perp && (spot?.balances.length ?? 0) === 0) {
    return (
      <section aria-label={t('tabBalances')} className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{t('noBalances')}</p>
      </section>
    );
  }

  return (
    <section aria-label={t('tabBalances')} className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">
        {t(
          status === 'ready'
            ? 'statusReady'
            : status === 'stale'
              ? 'statusStale'
              : status === 'error'
                ? 'statusError'
                : 'statusSyncing',
        )}
        {asOf && ` · ${formatRelativeTime(asOf) ?? ''}`}
      </p>

      {perp && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('perpTitle')}</h3>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('accountValue')}</dt>
              <dd className="text-lg font-semibold tabular-nums">{usd(perp.account_value)}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('totalNotional')}</dt>
              <dd className="text-lg font-semibold tabular-nums">{usd(perp.total_ntl_pos)}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('totalMargin')}</dt>
              <dd className="text-lg font-semibold tabular-nums">{usd(perp.total_margin_used)}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('withdrawable')}</dt>
              <dd className="text-lg font-semibold tabular-nums">{usd(perp.withdrawable)}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('crossAccountValue')}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {usd(perp.cross_account_value)}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('crossTotalNtl')}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {usd(perp.cross_total_ntl_pos)}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('crossTotalMargin')}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {usd(perp.cross_total_margin_used)}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{t('assetPositionsValue')}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {usd(perp.asset_positions_value)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {spot && spot.balances.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('spotTitle')}</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('coin')}</TableHead>
                  <TableHead className="text-right">{t('colToken')}</TableHead>
                  <TableHead className="text-right">{t('colTotal')}</TableHead>
                  <TableHead className="text-right">{t('colHold')}</TableHead>
                  <TableHead className="text-right">{t('colEntryNtl')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spot.balances.map((row) => (
                  <TableRow key={`${row.coin}-${row.token}`}>
                    <TableCell className="font-medium">{row.coin}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.token ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.hold)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{usd(row.entry_ntl)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
