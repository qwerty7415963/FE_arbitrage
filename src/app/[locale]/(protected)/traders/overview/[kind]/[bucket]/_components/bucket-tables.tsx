'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { fetchTraderDetail } from '@/services/traders';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { AssetIcon } from '@/components/shared/asset-icon';
import { Pagination } from '@/components/shared/pagination';
import { stripDexPrefix } from '@/lib/asset-meta';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
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
  queryClient?: QueryClient;
}

export function BucketTables(props: BucketTablesProps) {
  const t = useTranslations('traders.bucketDetail');
  const router = useRouter();
  let queryClient: QueryClient | undefined = props.queryClient;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = queryClient ?? useQueryClient();
  } catch {
    // no provider (tests) -> prefetch skipped
  }
  const tAll = useTranslations('traders');
  const detail = props.detail ?? null;
  const marketsSource = detail?.markets_source ?? 'positions';
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

  function sortIndicator(column: string) {
    if (column !== walletSort) return <ArrowUpDownIcon className="h-3.5 w-3.5" aria-hidden />;
    return walletDir === 'asc' ? (
      <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <ArrowDownIcon className="h-3.5 w-3.5" aria-hidden />
    );
  }

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
            <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
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
                      <button
                        onClick={() => toggleWalletSort('equity')}
                        className="inline-flex items-center gap-1"
                      >
                        {t('columns.equity')}
                        {sortIndicator('equity')}
                      </button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.positionValue')}</TableHead>
                    <TableHead
                      aria-sort={
                        walletSort === 'win_rate'
                          ? walletDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        onClick={() => toggleWalletSort('win_rate')}
                        className="inline-flex items-center gap-1"
                      >
                        {t('columns.winRate')}
                        {sortIndicator('win_rate')}
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
                      <button
                        onClick={() => toggleWalletSort('volume')}
                        className="inline-flex items-center gap-1"
                      >
                        {t('columns.volumeRange')}
                        {sortIndicator('volume')}
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
                      <button
                        onClick={() => toggleWalletSort('pnl')}
                        className="inline-flex items-center gap-1"
                      >
                        {t('columns.pnl')}
                        {sortIndicator('pnl')}
                      </button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.sumUpnl')}</TableHead>
                    <TableHead aria-sort="none">{t('columns.bias')}</TableHead>
                    <TableHead aria-sort="none">{t('columns.cohort')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletRows.map((r: BucketWalletRow) => (
                    <TableRow
                      key={r.address}
                      className="hover:bg-muted/50 cursor-pointer"
                      onMouseEnter={() => {
                        if (!queryClient) return;
                        const wallet = r.address.toLowerCase();
                        void queryClient.prefetchQuery({
                          queryKey: ['trader-detail', wallet, period],
                          queryFn: () => fetchTraderDetail(wallet, { period: period as never }),
                        });
                      }}
                      onClick={() => router.push('/traders/' + r.address)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push('/traders/' + r.address);
                        }
                      }}
                      aria-label={t('viewWallet', { address: r.address })}
                    >
                      <TableCell title={r.address}>{r.display_name ?? r.address}</TableCell>
                      <TableCell>{formatUsd(r.perp_equity) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.position_value) ?? '—'}</TableCell>
                      <TableCell>{formatPercent(r.win_rate, 1) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.volume_range) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.realized_pnl) ?? '—'}</TableCell>
                      <TableCell>{formatUsd(r.sum_upnl) ?? '—'}</TableCell>
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
              <Pagination
                currentPage={walletMeta.page ?? walletPage}
                totalPages={walletMeta.total_pages ?? 1}
                onPageChange={setWalletPage}
                disabled={wallets.isLoading}
                pageSize={20}
              />
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
            <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
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
                        {marketsSource === 'trades' ? t('columns.realizedPnl') : t('columns.upnl')}
                      </button>
                    </TableHead>
                    <TableHead aria-sort="none">{t('columns.upnlLoss')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketRows.map((r: BucketMarketRow, i: number) => {
                    const now = new Date();
                    const to = now.toISOString();
                    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                    return (
                      <TableRow
                        key={`${r.market}-${i}`}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() =>
                          router.push(
                            '/traders/markets/' +
                              encodeURIComponent(r.market) +
                              '?venue=hyperliquid&from=' +
                              encodeURIComponent(from) +
                              '&to=' +
                              encodeURIComponent(to),
                          )
                        }
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(
                              '/traders/markets/' +
                                encodeURIComponent(r.market) +
                                '?venue=hyperliquid&from=' +
                                encodeURIComponent(from) +
                                '&to=' +
                                encodeURIComponent(to),
                            );
                          }
                        }}
                        aria-label={t('viewMarket', { market: r.market })}
                      >
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            <AssetIcon
                              symbol={r.market}
                              logoUrl={r.logo_url}
                              category={r.asset_category}
                              size={14}
                              loading="lazy"
                            />
                            {stripDexPrefix(r.market)}
                            {r.market.toUpperCase().startsWith('XYZ:') && (
                              <span className="bg-foreground/10 shrink-0 rounded px-1 text-[8px] font-medium tracking-wide uppercase">
                                {t('treemap.tradfi')}
                              </span>
                            )}
                          </span>
                        </TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                currentPage={marketMeta.page ?? marketPage}
                totalPages={marketMeta.total_pages ?? 1}
                onPageChange={setMarketPage}
                disabled={markets.isLoading}
                pageSize={20}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
