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
  formatInteger,
  formatNumber,
  formatRelativeTime,
  formatUsd,
} from '@/lib/trader-format';
import { useTraderOrders } from '@/hooks/use-trader-orders';
import type { OrderStatusFilter } from '@/types/trader';

export interface OrdersSectionProps {
  walletAddress: string;
  enabled?: boolean;
}

function usd(value: number | null | undefined): string {
  return formatUsd(value) ?? '—';
}

export function OrdersSection({ walletAddress, enabled = true }: OrdersSectionProps) {
  const t = useTranslations('traders');
  const [status, setStatus] = useState<OrderStatusFilter>('open');
  const { orders, isLoading, error, refetch } = useTraderOrders(walletAddress, {
    status,
    enabled,
  });

  if (isLoading && !orders) {
    return (
      <section aria-label={t('tabOrders')} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && !orders) {
    return (
      <section aria-label={t('tabOrders')} className="flex flex-col items-start gap-2">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t('unknownError')}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </section>
    );
  }

  const rows = orders?.rows ?? [];
  const showStatusColumns = (orders?.status ?? status) === 'historical';

  return (
    <section aria-label={t('tabOrders')} className="flex flex-col gap-3">
      <div className="flex gap-1" role="group" aria-label={t('colStatus')}>
        {(['open', 'historical'] as const).map((value) => (
          <Button
            key={value}
            variant={status === value ? 'default' : 'outline'}
            size="sm"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {t(value === 'open' ? 'ordersOpen' : 'ordersHistorical')}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noOrders')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('coin')}</TableHead>
                <TableHead>{t('side')}</TableHead>
                <TableHead className="text-right">{t('colLimitPx')}</TableHead>
                <TableHead className="text-right">{t('size')}</TableHead>
                <TableHead className="text-right">{t('colOrigSize')}</TableHead>
                <TableHead className="text-right">{t('colOid')}</TableHead>
                <TableHead className="text-right">{t('colTime')}</TableHead>
                <TableHead className="text-right">{t('colReduceOnly')}</TableHead>
                <TableHead>{t('colOrderType')}</TableHead>
                <TableHead>{t('colTrigger')}</TableHead>
                <TableHead>{t('colTpsl')}</TableHead>
                {showStatusColumns && (
                  <>
                    <TableHead>{t('colStatus')}</TableHead>
                    <TableHead className="text-right">{t('colTime')}</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const tone = activitySideTone(row.side);
                return (
                  <TableRow key={row.oid}>
                    <TableCell className="font-medium">{row.coin}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          tone === 'positive'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {t(row.side === 'BUY' ? 'buy' : 'sell')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{usd(row.limit_px)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.size)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.orig_size)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInteger(row.oid)}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      title={formatDateTimeUtc(row.timestamp) ?? undefined}
                    >
                      {formatRelativeTime(row.timestamp) ?? row.timestamp}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.reduce_only ? t('yes') : t('no')}
                    </TableCell>
                    <TableCell>{row.order_type}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.trigger_condition}
                      {row.trigger_condition !== 'N/A' && ` @ ${usd(row.trigger_px)}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.is_position_tpsl ? t('yes') : t('no')}
                    </TableCell>
                    {showStatusColumns && (
                      <>
                        <TableCell>{row.order_status ?? '—'}</TableCell>
                        <TableCell
                          className="text-right tabular-nums"
                          title={formatDateTimeUtc(row.status_timestamp) ?? undefined}
                        >
                          {row.status_timestamp
                            ? (formatRelativeTime(row.status_timestamp) ?? row.status_timestamp)
                            : '—'}
                        </TableCell>
                      </>
                    )}
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
