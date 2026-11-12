'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBucketWallets } from '@/hooks/use-bucket-wallets';
import { useBucketMarkets } from '@/hooks/use-bucket-markets';
import { formatUsd, formatPercent, formatInteger } from '@/lib/trader-format';
import type { BucketDetail, BucketKind, BucketMarketRow, BucketWalletRow } from '@/types/trader';

export interface BucketTablesProps {
  kind?: BucketKind | string;
  bucket?: string;
  bucketId?: string;
  id?: string;
  detail?: BucketDetail | null;
  venue?: string;
  period?: string;
  range?: string;
}

export function BucketTables(props: BucketTablesProps) {
  const t = useTranslations('traders.bucketDetail');
  const tAll = useTranslations('traders');
  const detail = props.detail ?? null;
  const kind = props.kind ?? detail?.kind ?? 'pnl';
  const bucket = props.bucket ?? props.bucketId ?? props.id ?? detail?.bucket_id ?? '';
  const venue = props.venue ?? 'hyperliquid';
  const period = props.period ?? '30D';
  const range = props.range ?? '30D';

  const [tab, setTab] = useState<'wallets' | 'markets'>('wallets');
  const [walletSort, setWalletSort] = useState('equity');
  const [walletDir, setWalletDir] = useState<'asc' | 'desc'>('desc');
  const [walletPage, setWalletPage] = useState(1);
  const [marketSort, setMarketSort] = useState('notional');
  const [marketDir, setMarketDir] = useState<'asc' | 'desc'>('desc');
  const [marketPage, setMarketPage] = useState(1);
  const [marketSearch, setMarketSearch] = useState('');

  const wallets = useBucketWallets({
    kind,
    bucket,
    venue,
    period,
    sort: walletSort,
    dir: walletDir,
    page: walletPage,
    limit: 20,
  });
  const markets = useBucketMarkets({
    kind,
    bucket,
    venue,
    period,
    range,
    search: marketSearch,
    sort: marketSort,
    dir: marketDir,
    page: marketPage,
    limit: 20,
  });

  const walletRows = wallets.data?.data ?? [];
  const walletMeta = wallets.data?.meta ?? {};
  const marketRows = markets.data?.data ?? [];
  const marketMeta = markets.data?.meta ?? {};

  const toggleWalletSort = (col: string) => {
    if (walletSort === col) setWalletDir(walletDir === 'asc' ? 'desc' : 'asc');
    else {
      setWalletSort(col);
      setWalletDir('desc');
    }
    setWalletPage(1);
  };
  const toggleMarketSort = (col: string) => {
    if (marketSort === col) setMarketDir(marketDir === 'asc' ? 'desc' : 'asc');
    else {
      setMarketSort(col);
      setMarketDir('desc');
    }
    setMarketPage(1);
  };

  return (
    <div data-testid="bucket-tables" className="flex flex-col gap-3">
      <div className="flex items-center gap-2" role="tablist">
        <Button
          type="button"
          variant={tab === 'wallets' ? 'default' : 'outline'}
          size="sm"
          role="tab"
          aria-selected={tab === 'wallets'}
          onClick={() => setTab('wallets')}
        >
          {t('wallets')} ({walletMeta.total ?? 0})
        </Button>
        <Button
          type="button"
          variant={tab === 'markets' ? 'default' : 'outline'}
          size="sm"
          role="tab"
          aria-selected={tab === 'markets'}
          onClick={() => setTab('markets')}
        >
          {t('markets')} ({marketMeta.total ?? 0})
        </Button>
      </div>

      {tab === 'wallets' ? (
        <div className="flex flex-col gap-3">
          {wallets.isLoading ? (
            <div role="status" className="text-muted-foreground text-sm">
              {t('loading')}
            </div>
          ) : wallets.isError ? (
            <div className="flex items-center gap-2">
              <span className="text-destructive text-sm">{t('error')}</span>
              <Button size="sm" variant="outline" onClick={() => wallets.refetch()}>
                {t('retry')}
              </Button>
            </div>
          ) : walletRows.length === 0 ? (
            <div className="text-muted-foreground text-sm">{t('emptyWallets')}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead aria-sort="none">{t('bucketDetail.address')}</TableHead>
                    <TableHead
                      aria-sort={
                        walletSort === 'equity'
                          ? walletDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleWalletSort('equity')}>
                        {t('columns.equity')}
                      </button>
                    </TableHead>
                    <TableHead
                      aria-sort={
                        walletSort === 'win_rate'
                          ? walletDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleWalletSort('win_rate')}>
                        {t('columns.winRate')}
                      </button>
                    </TableHead>
                    <TableHead
                      aria-sort={
                        walletSort === 'volume'
                          ? walletDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleWalletSort('volume')}>
                        {t('columns.volume')}
                      </button>
                    </TableHead>
                    <TableHead
                      aria-sort={
                        walletSort === 'pnl'
                          ? walletDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleWalletSort('pnl')}>{t('columns.pnl')}</button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.bias')}</TableHead>
                    <TableHead aria-sort="none">{t('columns.cohort')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletRows.map((r: BucketWalletRow) => (
                    <TableRow key={r.address}>
                      <TableCell>{r.display_name ?? r.address}</TableCell>
                      <TableCell>{formatUsd(r.perp_equity) ?? '—'}</TableCell>
                      <TableCell>
                        {formatPercent(
                          r.win_rate === null || r.win_rate === undefined ? null : r.win_rate * 100,
                          1,
                        ) ?? '—'}
                      </TableCell>
                      <TableCell>{formatUsd(r.volume_range) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.realized_pnl) ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={
                            r.bias === 'very_bullish' ||
                            r.bias === 'bullish' ||
                            r.bias === 'slightly_bullish'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : r.bias === 'very_bearish' ||
                                  r.bias === 'bearish' ||
                                  r.bias === 'slightly_bearish'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-muted-foreground'
                          }
                        >
                          {t(('sentiment.' + r.bias) as never)}
                        </span>
                      </TableCell>
                      <TableCell>{tAll(('overview.bucketLabels.' + r.cohort) as never)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-sm">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(walletMeta.page ?? 1) <= 1}
                  onClick={() => setWalletPage((p) => Math.max(1, p - 1))}
                >
                  {t('bucketDetail.prev')}
                </Button>
                <span>
                  {walletMeta.page ?? 1} / {walletMeta.total_pages ?? 1}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!(walletMeta.has_more ?? false)}
                  onClick={() => setWalletPage((p) => p + 1)}
                >
                  {t('bucketDetail.next')}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Input
            placeholder={t('search')}
            value={marketSearch}
            onChange={(e) => {
              setMarketSearch(e.target.value);
              setMarketPage(1);
            }}
          />
          {markets.isLoading ? (
            <div role="status" className="text-muted-foreground text-sm">
              {t('loading')}
            </div>
          ) : markets.isError ? (
            <div className="flex items-center gap-2">
              <span className="text-destructive text-sm">{t('error')}</span>
              <Button size="sm" variant="outline" onClick={() => markets.refetch()}>
                {t('retry')}
              </Button>
            </div>
          ) : marketRows.length === 0 ? (
            <div className="text-muted-foreground text-sm">{t('emptyMarkets')}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      aria-sort={
                        marketSort === 'notional'
                          ? marketDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleMarketSort('notional')}>
                        {t('columns.market')}
                      </button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.sentiment')}</TableHead>
                    <TableHead
                      aria-sort={
                        marketSort === 'notional'
                          ? marketDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleMarketSort('notional')}>
                        {t('columns.notionalLong')}
                      </button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.notionalShort')}</TableHead>
                    <TableHead aria-sort="none">{t('columns.tradersLong')}</TableHead>
                    <TableHead aria-sort="none">{t('columns.tradersShort')}</TableHead>
                    <TableHead
                      aria-sort={
                        marketSort === 'upnl'
                          ? marketDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button onClick={() => toggleMarketSort('upnl')}>
                        {t('columns.upnlProfit')}
                      </button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.upnlLoss')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketRows.map((r: BucketMarketRow, i: number) => (
                    <TableRow key={`${r.market}-${i}`}>
                      <TableCell>{r.market}</TableCell>
                      <TableCell>
                        <span
                          className={
                            r.sentiment === 'very_bullish' ||
                            r.sentiment === 'bullish' ||
                            r.sentiment === 'slightly_bullish'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : r.sentiment === 'very_bearish' ||
                                  r.sentiment === 'bearish' ||
                                  r.sentiment === 'slightly_bearish'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-muted-foreground'
                          }
                        >
                          {t(('sentiment.' + r.sentiment) as never)}
                        </span>
                      </TableCell>
                      <TableCell>{formatUsd(r.notional_long) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.notional_short) ?? '—'}</TableCell>
                      <TableCell>{formatInteger(r.traders_long) ?? '—'}</TableCell>
                      <TableCell>{formatInteger(r.traders_short) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.pnl_profit) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.pnl_loss) ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-sm">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(marketMeta.page ?? 1) <= 1}
                  onClick={() => setMarketPage((p) => Math.max(1, p - 1))}
                >
                  {t('bucketDetail.prev')}
                </Button>
                <span>
                  {marketMeta.page ?? 1} / {marketMeta.total_pages ?? 1}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!(marketMeta.has_more ?? false)}
                  onClick={() => setMarketPage((p) => p + 1)}
                >
                  {t('bucketDetail.next')}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
