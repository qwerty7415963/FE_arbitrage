'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/infrastructure/api-client';
import { searchTraders } from '@/services/traders';
import { validateTraderSearch } from '@/lib/trader-validation';
import {
  buildTraderSearchParams,
  parseTraderSearchParams,
  saveLastScan,
} from '@/lib/trader-url-state';
import {
  clearMetricFilter,
  clearMetricFilters,
  defaultDraft,
  draftFromQuery,
  draftToQuery,
  type FilterDraft,
  type MetricFilterKey,
} from '@/lib/trader-filter-draft';
import { ScannerHeader } from './_components/scanner-header';
import { FilterSheet } from './_components/filter-sheet';
import { FilterChips } from './_components/filter-chips';
import { TraderTable } from '@/components/shared/traders/trader-table';
import { AddToTraderGroupModal } from '@/components/shared/traders/add-to-trader-group-modal';
import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_TRADER_SEARCH_QUERY,
  SCANNER_PAGE_SIZE,
  type MemberInput,
  type PeriodMetrics,
  type TraderPeriod,
  type TraderSearchQuery,
  type TraderSortBy,
} from '@/types/trader';
import { Loader2Icon, PlusIcon } from 'lucide-react';

type SearchError =
  | 'minGreaterThanMax'
  | 'invalidNumber'
  | 'outOfRange'
  | 'invalidInteger'
  | 'invalidDateTime'
  | 'invalidLimit'
  | 'invalidSort'
  | 'invalidPeriod'
  | 'unknownError';

export default function TradersScannerPage() {
  return (
    <Suspense>
      <ScannerContent />
    </Suspense>
  );
}

function ScannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;
  const groupParam = searchParams.get('group') ?? undefined;
  const t = useTranslations('traders');

  const [form, setForm] = useState<FilterDraft>(() => {
    // The scanner no longer has a group picker: an explicit ?group_id= in a
    // shared link is ignored instead of becoming a ghost filter.
    const { groupId: _initialGroup, ...initialRest } = parseTraderSearchParams(searchParams);
    void _initialGroup;
    return draftFromQuery({ ...DEFAULT_TRADER_SEARCH_QUERY, ...initialRest });
  });
  const [sortBy, setSortBy] = useState<TraderSortBy>(
    () => parseTraderSearchParams(searchParams).sortBy ?? DEFAULT_SORT_BY,
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    () => parseTraderSearchParams(searchParams).sortDirection ?? DEFAULT_SORT_DIRECTION,
  );
  const [rows, setRows] = useState<PeriodMetrics[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addMembers, setAddMembers] = useState<MemberInput[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const lastRequestRef = useRef<{ query: TraderSearchQuery; append: boolean } | null>(null);
  const lastWrittenUrlRef = useRef<string | null>(null);
  const initialUrlRef = useRef<string | null>(null);

  const syncUrl = useCallback(
    (query: TraderSearchQuery) => {
      const serialized = buildTraderSearchParams(query).toString();
      lastWrittenUrlRef.current = serialized;
      saveLastScan(serialized);
      // Push (not replace) so each search is a history entry and
      // browser back/forward restores prior searches (FE-025).
      router.push(`/${locale}/traders${serialized ? `?${serialized}` : ''}`, { scroll: false });
    },
    [router, locale],
  );

  const runSearch = useCallback(async (query: TraderSearchQuery, append: boolean) => {
    const invalid = validateTraderSearch(query);
    if (invalid) {
      setError(invalid);
      setCanRetry(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    lastRequestRef.current = { query, append };

    setIsSearching(true);
    setError(null);
    setCanRetry(false);
    try {
      const result = await searchTraders(query, { signal: controller.signal });
      if (requestIdRef.current !== requestId) return;
      setRows((prev) => {
        if (!append) return result.data;
        const seen = new Set(prev.map((r) => `${r.venue}:${r.wallet_address}`));
        return [...prev, ...result.data.filter((r) => !seen.has(`${r.venue}:${r.wallet_address}`))];
      });
      setCursor(result.meta.cursor ?? null);
      setHasMore(result.meta.has_more ?? false);
      setSelected([]);
      setHasSearched(true);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      if (err instanceof ApiError && err.code === 'ABORTED') return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('unknownError');
      setCanRetry(true);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }, []);

  const effectiveQuery = useCallback(
    (overrides: Partial<TraderSearchQuery> = {}): TraderSearchQuery => ({
      ...draftToQuery(form),
      sortBy,
      sortDirection,
      limit: SCANNER_PAGE_SIZE,
      cursor: undefined,
      ...overrides,
    }),
    [form, sortBy, sortDirection],
  );

  const commitDraft = useCallback(
    (nextDraft: FilterDraft) => {
      setForm(nextDraft);
      const query: TraderSearchQuery = {
        ...draftToQuery(nextDraft),
        sortBy,
        sortDirection,
        limit: SCANNER_PAGE_SIZE,
        cursor: undefined,
      };
      setCursor(null);
      syncUrl(query);
      void runSearch(query, false);
    },
    [sortBy, sortDirection, syncUrl, runSearch],
  );

  const applyDraft = commitDraft;

  const handleRemoveMetricFilter = useCallback(
    (key: MetricFilterKey) => {
      commitDraft(clearMetricFilter(form, key));
    },
    [commitDraft, form],
  );

  const handleResetFilters = useCallback(() => {
    commitDraft(clearMetricFilters(form));
  }, [commitDraft, form]);

  const handlePeriodChange = useCallback(
    (period: TraderPeriod) => {
      const next = { ...form, period };
      setForm(next);
      const query: TraderSearchQuery = {
        ...draftToQuery(next),
        sortBy,
        sortDirection,
        limit: SCANNER_PAGE_SIZE,
        cursor: undefined,
      };
      setCursor(null);
      syncUrl(query);
      void runSearch(query, false);
    },
    [form, sortBy, sortDirection, syncUrl, runSearch],
  );

  const handleSortChange = useCallback(
    (column: TraderSortBy) => {
      const nextDirection = column === sortBy && sortDirection === 'desc' ? 'asc' : 'desc';
      setSortBy(column);
      setSortDirection(nextDirection);
      const query = effectiveQuery({ sortBy: column, sortDirection: nextDirection });
      setCursor(null);
      syncUrl(query);
      void runSearch(query, false);
    },
    [effectiveQuery, sortBy, sortDirection, syncUrl, runSearch],
  );

  const handleLoadMore = useCallback(() => {
    if (!cursor) return;
    const query = effectiveQuery({ cursor });
    syncUrl(query);
    void runSearch(query, true);
  }, [cursor, effectiveQuery, syncUrl, runSearch]);

  const handleRetry = useCallback(() => {
    const last = lastRequestRef.current;
    if (last) void runSearch(last.query, last.append);
  }, [runSearch]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    const nextForm = defaultDraft();
    setForm(nextForm);
    setSortBy(DEFAULT_SORT_BY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setCursor(null);
    setSelected([]);
    syncUrl({});
    // Reset returns to the default list instead of a blank page.
    void runSearch(
      {
        ...draftToQuery(nextForm),
        sortBy: DEFAULT_SORT_BY,
        sortDirection: DEFAULT_SORT_DIRECTION,
        limit: SCANNER_PAGE_SIZE,
        cursor: undefined,
      },
      false,
    );
  }, [syncUrl, runSearch]);

  const handleApplySavedSearch = useCallback(
    (savedQuery: TraderSearchQuery) => {
      const { cursor: _cursor, groupId: _savedGroup, ...rest } = savedQuery;
      void _cursor;
      void _savedGroup;
      const nextForm = draftFromQuery(rest);
      const query = {
        ...draftToQuery(nextForm),
        sortBy: rest.sortBy ?? DEFAULT_SORT_BY,
        sortDirection: rest.sortDirection ?? DEFAULT_SORT_DIRECTION,
        limit: SCANNER_PAGE_SIZE,
        cursor: undefined,
      };
      setForm(nextForm);
      setSortBy(query.sortBy ?? DEFAULT_SORT_BY);
      setSortDirection(query.sortDirection ?? DEFAULT_SORT_DIRECTION);
      setCursor(null);
      syncUrl(query);
      void runSearch(query, false);
    },
    [syncUrl, runSearch],
  );

  // Restore state on back/forward navigation (FE-025): the URL is the external
  // system here, so this callback syncs it into state when navigation happens.
  const restoreFromParams = useCallback(
    (params: URLSearchParams) => {
      const parsed = parseTraderSearchParams(params);
      const { cursor: parsedCursor, groupId: _restoredGroup, ...rest } = parsed;
      void _restoredGroup;
      const base = { ...DEFAULT_TRADER_SEARCH_QUERY, ...rest };
      setForm(draftFromQuery(base));
      const nextSortBy = parsed.sortBy ?? DEFAULT_SORT_BY;
      const nextDirection = parsed.sortDirection ?? DEFAULT_SORT_DIRECTION;
      setSortBy(nextSortBy);
      setSortDirection(nextDirection);
      void runSearch(
        {
          ...draftToQuery(draftFromQuery(base)),
          sortBy: nextSortBy,
          sortDirection: nextDirection,
          limit: SCANNER_PAGE_SIZE,
          cursor: parsedCursor,
        },
        false,
      );
    },
    [runSearch],
  );

  const urlString = searchParams.toString();
  // Syncs browser navigation (refresh with params, back/forward) into state.
  // The URL is the external system here; syncing it in this effect is intentional.
  // Entering the scanner always runs a search: with URL params it restores
  // that search, without params it loads the default list (venue + period +
  // default sort) instead of leaving a blank page.
  useEffect(() => {
    if (initialUrlRef.current === null) {
      initialUrlRef.current = urlString;
      // Claim the initial URL so a repeated effect run (StrictMode dev
      // double-invoke) does not mistake mount for a back/forward navigation.
      lastWrittenUrlRef.current = urlString;

      restoreFromParams(searchParams);
      return;
    }
    if (urlString === lastWrittenUrlRef.current) return;
    lastWrittenUrlRef.current = urlString;
    restoreFromParams(searchParams);
  }, [urlString, searchParams, restoreFromParams]);

  function openAddForAddresses(addresses: string[]) {
    const byAddress = new Map(rows.map((r) => [r.wallet_address, r]));
    setAddMembers(
      addresses.map((wallet_address) => ({
        venue: byAddress.get(wallet_address)?.venue ?? 'hyperliquid',
        wallet_address,
      })),
    );
    setAddOpen(true);
  }

  const showSkeleton = isSearching && rows.length === 0;
  const showEmpty = hasSearched && !isSearching && rows.length === 0 && !error;

  const resultText = hasSearched
    ? hasMore
      ? t('resultsCapped', { count: rows.length })
      : t('results', { count: rows.length })
    : null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <ScannerHeader
        period={form.period}
        onPeriodChange={handlePeriodChange}
        venue={form.venue}
        resultText={resultText}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        disabled={isSearching}
      />

      <div id="scanner-metric-filters">
        <FilterSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          draft={form}
          onApply={applyDraft}
          onResetFilters={handleResetFilters}
          onApplySavedSearch={handleApplySavedSearch}
          sortBy={sortBy}
          sortDirection={sortDirection}
          disabled={isSearching}
        />
      </div>

      <FilterChips draft={form} onRemove={handleRemoveMetricFilter} disabled={isSearching} />

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t(error)}{' '}
          {canRetry && (
            <Button variant="outline" size="sm" className="ml-2" onClick={handleRetry}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}

      {hasSearched && (
        <div className="flex items-center justify-end gap-2">
          {isSearching && rows.length > 0 && (
            <span className="text-muted-foreground inline-flex items-center text-sm">
              <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
              {t('updating')}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => openAddForAddresses(selected)}
            disabled={selected.length === 0}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('addToGroup')} ({selected.length})
          </Button>
        </div>
      )}

      {showSkeleton ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-12 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        rows.length > 0 && (
          <>
            <TraderTable
              rows={rows}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              selectable
              selected={selected}
              onSelect={setSelected}
              onView={(row) => router.push(`/${locale}/traders/${row.wallet_address}`)}
              onAdd={(row) => openAddForAddresses([row.wallet_address])}
            />
            {hasMore && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleLoadMore} disabled={isSearching}>
                  {isSearching && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  {t('loadMore')}
                </Button>
              </div>
            )}
          </>
        )
      )}

      {showEmpty && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-muted-foreground text-sm">{t('noTraders')}</p>
          <Button variant="outline" size="sm" onClick={handleReset}>
            {t('resetFilters')}
          </Button>
        </div>
      )}

      <AddToTraderGroupModal
        open={addOpen}
        onOpenChange={setAddOpen}
        members={addMembers}
        defaultGroupId={groupParam}
        onSuccess={() => setSelected([])}
      />
    </div>
  );
}
