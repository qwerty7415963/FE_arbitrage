'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/infrastructure/api-client';
import { listTraderGroups, searchTraders } from '@/services/traders';
import { validateTraderSearch } from '@/lib/trader-validation';
import { buildTraderSearchParams, parseTraderSearchParams } from '@/lib/trader-url-state';
import {
  defaultDraft,
  draftFromQuery,
  draftToQuery,
  type FilterDraft,
} from '@/lib/trader-filter-draft';
import { TraderFilters } from '@/components/shared/traders/trader-filters';
import { SavedSearches } from '@/components/shared/traders/saved-searches';
import { TraderTable } from '@/components/shared/traders/trader-table';
import { AddToTraderGroupModal } from '@/components/shared/traders/add-to-trader-group-modal';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_TRADER_SEARCH_QUERY,
  SCANNER_PAGE_SIZE,
  type MemberInput,
  type PeriodMetrics,
  type TraderGroup,
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
  | 'groupAuthRequired'
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

  const [form, setForm] = useState<FilterDraft>(() =>
    draftFromQuery({ ...DEFAULT_TRADER_SEARCH_QUERY, ...parseTraderSearchParams(searchParams) }),
  );
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
  const [groups, setGroups] = useState<TraderGroup[] | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const lastRequestRef = useRef<{ query: TraderSearchQuery; append: boolean } | null>(null);
  const lastWrittenUrlRef = useRef<string | null>(null);
  const initialUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGroups() {
      try {
        const data = await listTraderGroups();
        if (!cancelled) setGroups(data);
      } catch {
        if (!cancelled) setGroups(null);
      }
    }
    loadGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncUrl = useCallback(
    (query: TraderSearchQuery) => {
      const serialized = buildTraderSearchParams(query).toString();
      lastWrittenUrlRef.current = serialized;
      router.replace(`/${locale}/wallets${serialized ? `?${serialized}` : ''}`, { scroll: false });
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
      if (err instanceof ApiError && err.status === 401 && query.groupId) {
        setError('groupAuthRequired');
      } else {
        setError('unknownError');
      }
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

  const handleSearch = useCallback(() => {
    const query = effectiveQuery();
    setCursor(null);
    syncUrl(query);
    void runSearch(query, false);
  }, [effectiveQuery, syncUrl, runSearch]);

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
    setForm(defaultDraft());
    setSortBy(DEFAULT_SORT_BY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setRows([]);
    setCursor(null);
    setHasMore(false);
    setHasSearched(false);
    setError(null);
    setCanRetry(false);
    setSelected([]);
    syncUrl({});
  }, [syncUrl]);

  const handleApplySavedSearch = useCallback(
    (savedQuery: TraderSearchQuery) => {
      const { cursor: _cursor, ...rest } = savedQuery;
      void _cursor;
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
      const { cursor: parsedCursor, ...rest } = parsed;
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
  useEffect(() => {
    if (initialUrlRef.current === null) {
      initialUrlRef.current = urlString;
      // Claim the initial URL so a repeated effect run (StrictMode dev
      // double-invoke) does not mistake mount for a back/forward navigation.
      lastWrittenUrlRef.current = urlString;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (urlString) restoreFromParams(searchParams);
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <TraderFilters
        draft={form}
        onDraftChange={setForm}
        onSearch={handleSearch}
        onReset={handleReset}
        groups={groups}
        disabled={isSearching}
      />

      <SavedSearches
        query={{ ...draftToQuery(form), sortBy, sortDirection, limit: SCANNER_PAGE_SIZE }}
        onApply={handleApplySavedSearch}
        disabled={isSearching}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {t(error)}{' '}
          {error === 'groupAuthRequired' && (
            <span className="ml-2 inline-flex">
              <ConnectWalletButton />
            </span>
          )}{' '}
          {canRetry && (
            <Button variant="outline" size="sm" className="ml-2" onClick={handleRetry}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}

      {hasSearched && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t('results', { count: rows.length })}
            {isSearching && rows.length > 0 && (
              <span className="ml-2 inline-flex items-center">
                <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                {t('updating')}
              </span>
            )}
          </p>
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
              onView={(row) => router.push(`/${locale}/wallets/${row.wallet_address}`)}
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
