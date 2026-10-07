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
import type { PositionDataStatus, PositionSnapshot } from '@/types/trader';

const STATUS_LABEL_KEYS: Record<PositionDataStatus, string> = {
  ready: 'statusReady',
  syncing: 'positionsSyncing',
  stale: 'positionsStale',
  error: 'positionsError',
};

export interface PositionsSectionProps {
  snapshot: PositionSnapshot | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

function formatUsdOrDash(value: number | null): string {
  return formatUsd(value) ?? '—';
}

export function PositionsSection({ snapshot, isLoading, error, onRetry }: PositionsSectionProps) {
  const t = useTranslations('traders');

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
  const status: PositionDataStatus = snapshot?.data_status ?? 'syncing';
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
              <TableHead>{t('coin')}</TableHead>
              <TableHead>{t('side')}</TableHead>
              <TableHead className="text-right">{t('size')}</TableHead>
              <TableHead className="text-right">{t('entryPrice')}</TableHead>
              <TableHead className="text-right">{t('markPrice')}</TableHead>
              <TableHead className="text-right">{t('unrealizedPnl')}</TableHead>
              <TableHead className="text-right">{t('roi')}</TableHead>
              <TableHead className="text-right">{t('liquidationPrice')}</TableHead>
              <TableHead className="text-right">{t('leverage')}</TableHead>
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
