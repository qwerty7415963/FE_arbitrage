'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { getVenues, getFundingArbitrage } from '@/services/funding-arbitrage';
import type { Venue, ArbitragePair, SortOption } from '@/types/funding-arbitrage';
import { VenueSelector } from './venue-selector';
import { FundingTable } from './funding-table';
import { Pagination } from '@/components/shared/pagination';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rate_8h_desc', label: 'Rate 8h ↓' },
  { value: 'rate_1h_desc', label: 'Rate 1h ↓' },
  { value: 'apr_desc', label: 'APR ↓' },
  { value: 'spread_desc', label: 'Spread ↓' },
];

const PAGE_SIZE = 10;

export default function FundingArbitragePage() {
  const { address, isAuthenticated } = useAuthStore();

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
        setError('Failed to load venues');
      } finally {
        setIsLoadingVenues(false);
      }
    }
    loadVenues();
  }, []);

  const fetchData = useCallback(
    async (page: number) => {
      if (selectedVenueIds.length < 2) {
        setError('Select at least 2 venues');
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoadingData(false);
      }
    },
    [selectedVenueIds, sort],
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
        <h1 className="text-2xl font-bold">Funding Arbitrage</h1>
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
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Button onClick={handleSearch} disabled={isLoadingData || selectedVenueIds.length < 2}>
          {isLoadingData ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
          Search
        </Button>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      {isLoadingData && pairs.length === 0 ? (
        <div className="text-muted-foreground flex items-center justify-center py-12">
          <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
          Loading...
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
