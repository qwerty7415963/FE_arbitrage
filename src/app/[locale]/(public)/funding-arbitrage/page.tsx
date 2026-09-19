'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/stores/auth';
import { getVenues, getFundingArbitrage } from '@/services/funding-arbitrage';
import type { Venue, ArbitragePair, SortOption } from '@/types/funding-arbitrage';
import { VenueSelector } from './venue-selector';
import { FundingTable } from './funding-table';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'apr_4h_desc', label: 'APR 4h ↓' },
  { value: 'apr_1h_desc', label: 'APR 1h ↓' },
  { value: 'apy_desc', label: 'APY ↓' },
  { value: 'spread_desc', label: 'Spread ↓' },
];

export default function FundingArbitragePage() {
  const { address, isAuthenticated } = useAuthStore();
  const t = useTranslations('common');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('apr_4h_desc');
  const [pairs, setPairs] = useState<ArbitragePair[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      try {
        const data = await getVenues();
        setVenues(data.filter((v) => v.status === 'ACTIVE'));
      } catch {
        setError('Failed to load venues');
      } finally {
        setIsLoadingVenues(false);
      }
    }
    loadVenues();
  }, []);

  const handleSearch = useCallback(
    async (isRefresh = false) => {
      if (selectedVenueIds.length < 2) {
        setError('Select at least 2 venues');
        return;
      }

      setIsLoadingData(true);
      setError(null);
      setCursor(undefined);

      try {
        const result = await getFundingArbitrage(selectedVenueIds, {
          sort,
          limit: 50,
          refresh: isRefresh,
        });
        setPairs(result.data.pairs);
        setHasMore(result.meta.has_more ?? false);
        setCursor(result.meta.cursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoadingData(false);
      }
    },
    [selectedVenueIds, sort],
  );

  const handleLoadMore = useCallback(async () => {
    if (!cursor || selectedVenueIds.length < 2) return;

    setIsLoadingData(true);
    try {
      const result = await getFundingArbitrage(selectedVenueIds, {
        sort,
        limit: 50,
        cursor,
      });
      setPairs((prev) => [...prev, ...result.data.pairs]);
      setHasMore(result.meta.has_more ?? false);
      setCursor(result.meta.cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoadingData(false);
    }
  }, [cursor, selectedVenueIds, sort]);

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

        <Button
          onClick={() => handleSearch(false)}
          disabled={isLoadingData || selectedVenueIds.length < 2}
        >
          {isLoadingData ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
          Search
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSearch(true)}
          disabled={isLoadingData || selectedVenueIds.length < 2}
        >
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Refresh
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

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingData}>
                {isLoadingData ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
