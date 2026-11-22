'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMarketWallets } from '@/hooks/use-market-wallets';
import { formatUsd, formatPercent } from '@/lib/trader-format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Pagination } from '@/components/shared/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { MarketWalletRow } from '@/types/trader';

export interface MarketWalletTableProps {
  market?: string;
  marketId?: string;
  venue?: string;
  from?: string;
  to?: string;
}

function parseNum(v: string): number | undefined {
  const n = Number(v);
  return v.trim() === '' || Number.isNaN(n) ? undefined : n;
}

export function MarketWalletTable(props: MarketWalletTableProps) {
  const t = useTranslations('traders');
  const searchParams = useSearchParams();
  const router = useRouter();

  const market = props.market ?? props.marketId ?? searchParams.get('market') ?? '';
  const venue = props.venue ?? searchParams.get('venue') ?? 'hyperliquid';

  const [winRateMin, setWinRateMin] = useState(searchParams.get('win_rate_min') ?? '');
  const [tradesMin, setTradesMin] = useState(searchParams.get('trades_min') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'volume');
  const [dir, setDir] = useState(searchParams.get('dir') ?? 'desc');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1') || 1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit') ?? '20') || 20);

  const from = props.from ?? searchParams.get('from') ?? undefined;
  const to = props.to ?? searchParams.get('to') ?? undefined;

  const wallets = useMarketWallets(market, {
    venue,
    from,
    to,
    win_rate_min: parseNum(winRateMin),
    trades_min: parseNum(tradesMin),
    sort,
    dir,
    page,
    limit,
  });

  const rows = wallets.data?.data ?? [];
  const meta = wallets.data?.meta ?? {};

  const pushParams = (next: {
    from?: string;
    to?: string;
    winRateMin?: string;
    tradesMin?: string;
    sort?: string;
    dir?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const f = next.from ?? from;
    const tt = next.to ?? to;
    const w = next.winRateMin ?? winRateMin;
    const tr = next.tradesMin ?? tradesMin;
    const s = next.sort ?? sort;
    const d = next.dir ?? dir;
    const p = next.page ?? page;
    const l = next.limit ?? limit;
    if (f) params.set('from', f);
    else params.delete('from');
    if (tt) params.set('to', tt);
    else params.delete('to');
    if (w) params.set('win_rate_min', w);
    else params.delete('win_rate_min');
    if (tr) params.set('trades_min', tr);
    else params.delete('trades_min');
    params.set('sort', s);
    params.set('dir', d);
    params.set('page', String(p));
    params.set('limit', String(l));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const applyFilters = () => {
    setPage(1);
    pushParams({ winRateMin, tradesMin, sort, dir, page: 1, limit });
  };

  const resetFilters = () => {
    const now = new Date();
    const f = new Date(now.getTime() - 7 * 86400000).toISOString();
    const tt = now.toISOString();
    setWinRateMin('');
    setTradesMin('');
    setSort('volume');
    setDir('desc');
    setPage(1);
    pushParams({
      from: f,
      to: tt,
      winRateMin: '',
      tradesMin: '',
      sort: 'volume',
      dir: 'desc',
      page: 1,
    });
  };

  const toggleSort = (key: string) => {
    let nextDir = dir;
    let nextSort = sort;
    if (sort === key) {
      nextDir = dir === 'asc' ? 'desc' : 'asc';
    } else {
      nextSort = key;
      nextDir = 'desc';
    }
    setSort(nextSort);
    setDir(nextDir);
    setPage(1);
    pushParams({ sort: nextSort, dir: nextDir, page: 1 });
  };

  const sortIcon = (key: string) => {
    if (sort !== key) return <ArrowUpDown className="ml-1 inline h-3 w-3" />;
    return dir === 'asc' ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  const ariaSort = (key: string): 'ascending' | 'descending' | 'none' => {
    if (sort !== key) return 'none';
    return dir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div data-testid="market-wallet-table" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <DateRangePicker
          from={from ?? ''}
          to={to ?? ''}
          onChange={(r) => {
            setPage(1);
            pushParams({ from: r.from, to: r.to, page: 1 });
          }}
        />
        <label className="flex flex-col text-xs">
          <span className="text-muted-foreground">{t('winRateMin')}</span>
          <Input
            type="number"
            value={winRateMin}
            onChange={(e) => setWinRateMin(e.target.value)}
            className="w-28"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="text-muted-foreground">{t('tradesMin')}</span>
          <Input
            type="number"
            value={tradesMin}
            onChange={(e) => setTradesMin(e.target.value)}
            className="w-28"
          />
        </label>
        <Button size="sm" onClick={applyFilters}>
          {t('marketDetail.apply')}
        </Button>
        <Button size="sm" variant="outline" onClick={resetFilters}>
          {t('marketDetail.reset')}
        </Button>
      </div>

      {wallets.isLoading ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : wallets.isError ? (
        <div className="flex items-center gap-2">
          <span className="text-destructive text-sm">{t('unknownError')}</span>
          <Button size="sm" variant="outline" onClick={() => wallets.refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground text-sm">{t('noWallets')}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('address')}</TableHead>
                <TableHead>{t('cohort')}</TableHead>
                <TableHead>{t('bias')}</TableHead>
                <TableHead aria-sort={ariaSort('volume')}>
                  <button type="button" onClick={() => toggleSort('volume')}>
                    {t('volume')} {sortIcon('volume')}
                  </button>
                </TableHead>
                <TableHead aria-sort={ariaSort('trades')}>
                  <button type="button" onClick={() => toggleSort('trades')}>
                    {t('tradeCount')} {sortIcon('trades')}
                  </button>
                </TableHead>
                <TableHead aria-sort={ariaSort('win_rate')}>
                  <button type="button" onClick={() => toggleSort('win_rate')}>
                    {t('winRate')} {sortIcon('win_rate')}
                  </button>
                </TableHead>
                <TableHead aria-sort={ariaSort('realized_pnl')}>
                  <button type="button" onClick={() => toggleSort('realized_pnl')}>
                    {t('realizedPnl')} {sortIcon('realized_pnl')}
                  </button>
                </TableHead>
                <TableHead>{t('lastTrade')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: MarketWalletRow) => (
                <TableRow
                  key={r.address}
                  className="cursor-pointer"
                  onClick={() => router.push(`/traders/${r.address}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/traders/${r.address}`);
                    }
                  }}
                  tabIndex={0}
                >
                  <TableCell title={r.address}>{r.display_name ?? r.address}</TableCell>
                  <TableCell>{r.cohort}</TableCell>
                  <TableCell>{r.bias}</TableCell>
                  <TableCell>{formatUsd(r.volume) ?? '�?"'}</TableCell>
                  <TableCell>{r.trades}</TableCell>
                  <TableCell>{formatPercent(r.win_rate, 1) ?? '�?"'}</TableCell>
                  <TableCell>{formatUsd(r.realized_pnl) ?? '�?"'}</TableCell>
                  <TableCell>{r.last_trade_at ?? '�?"'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={meta.page ?? page}
            totalPages={meta.total_pages ?? 1}
            onPageChange={setPage}
            disabled={wallets.isLoading}
            pageSize={limit}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
