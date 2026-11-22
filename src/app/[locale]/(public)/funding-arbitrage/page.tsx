'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2Icon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { useTranslations } from 'next-intl';
import { getVenues, getFundingArbitrage } from '@/services/funding-arbitrage';
import type { Venue, ArbitragePair, SortOption } from '@/types/funding-arbitrage';
import { VenueSelector } from './venue-selector';
import { FundingTable } from './funding-table';
import { Pagination } from '@/components/shared/pagination';

const PAGE_SIZE = 10;

export default function FundingArbitragePage() {
  const { address, isAuthenticated } = useAuthStore();
  const t = useTranslations('fundingArbitrage');
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'rate_8h_desc', label: t('sort.rate8h') },
    { value: 'rate_1h_desc', label: t('sort.rate1h') },
    { value: 'apr_desc', label: t('sort.apr') },
    { value: 'spread_desc', label: t('sort.spread') },
  ];

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('rate_8h_desc');
  const [pairs, setPairs] = useState<ArbitragePair[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      try {
        const data = await getVenues();
        setVenues(data);
      } catch {
        setError(t('failedVenues'));
      } finally {
        setIsLoadingVenues(false);
      }
    }
    loadVenues();
  }, [t]);

  const fetchData = useCallback(
    async (page: number) => {
      if (selectedVenueIds.length < 2) {
        setError(t('selectAtLeast'));
        return;
      }

      setIsLoadingData(true);
      setError(null);

      try {
        const result = await getFundingArbitrage(selectedVenueIds, {
          sort,
          page,
          limit: PAGE_SIZE,
        });
        setPairs(result.data.pairs ?? []);
        setTotalPages(result.meta.total_pages ?? 1);
        setCurrentPage(result.meta.page ?? page);
      } catch {
        setError(t('failedFetch'));
      } finally {
        setIsLoadingData(false);
      }
    },
    [selectedVenueIds, sort, t],
  );

  const handleSearch = useCallback(() => {
    fetchData(1);
  }, [fetchData]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(page);
    },
    [fetchData],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {isAuthenticated && address && (
          <span className="text-muted-foreground text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <VenueSelector
          venues={venues}
          selected={selectedVenueIds}
          onChange={setSelectedVenueIds}
          disabled={isLoadingVenues}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-sm"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Button onClick={handleSearch} disabled={isLoadingData || selectedVenueIds.length < 2}>
          {isLoadingData ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('search')}
        </Button>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      {isLoadingData && pairs.length === 0 ? (
        <div className="flex flex-col gap-2 py-12" role="status" aria-label={t('loading')}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : (
        <>
          <FundingTable pairs={pairs} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={isLoadingData}
          />
        </>
      )}
    </div>
  );
}
