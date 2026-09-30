'use client';

import { Suspense, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/infrastructure/api-client';
import { scanWallets } from '@/services/wallets';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { ScanFilters, validateFilters } from '@/components/shared/wallets/scan-filters';
import { SavedScans } from '@/components/shared/wallets/saved-scans';
import { WalletTable } from '@/components/shared/wallets/wallet-table';
import { AddToGroupModal } from '@/components/shared/groups/add-to-group-modal';
import { Pagination } from '@/app/[locale]/(public)/funding-arbitrage/pagination';
import type { GroupWalletQuery, Wallet } from '@/types/wallet-scan';
import { Loader2Icon, PlusIcon } from 'lucide-react';

const PAGE_SIZE = 10;

const DEFAULT_QUERY: GroupWalletQuery = {
  timeframe: '30D',
  sort: 'pnl',
  order: 'desc',
  page: 1,
  limit: PAGE_SIZE,
};

export default function WalletsScannerPage() {
  return (
    <Suspense>
      <ScannerContent />
    </Suspense>
  );
}

function ScannerContent() {
  const searchParams = useSearchParams();
  const groupParam = searchParams.get('group') ?? undefined;
  const t = useTranslations('wallets');
  const [query, setQuery] = useState<GroupWalletQuery>(DEFAULT_QUERY);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const runScan = useCallback(
    async (page: number, q: GroupWalletQuery) => {
      const invalid = validateFilters(q.filters ?? []);
      if (invalid === 'minGreaterThanMax') {
        setError(t('minGreaterThanMax'));
        return;
      }
      if (invalid === 'invalidNumber') {
        setError(t('invalidNumber'));
        return;
      }

      setIsScanning(true);
      setError(null);
      setNeedsAuth(false);
      try {
        const result = await scanWallets({ ...q, page });
        setWallets(result.data ?? []);
        setTotalPages(result.meta.total_pages ?? 1);
        setTotal(result.meta.total ?? 0);
        setCurrentPage(result.meta.page ?? page);
        setSelected([]);
        setHasScanned(true);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setNeedsAuth(true);
          setError(t('authRequired'));
        } else {
          setError(err instanceof Error ? err.message : t('unknownError'));
        }
      } finally {
        setIsScanning(false);
      }
    },
    [t],
  );

  function handleScan() {
    runScan(1, query);
  }

  function handleClear() {
    setQuery(DEFAULT_QUERY);
    setWallets([]);
    setSelected([]);
    setHasScanned(false);
    setError(null);
    setCurrentPage(1);
    setTotalPages(1);
    setTotal(0);
  }

  function handleApplySavedSearch(savedQuery: GroupWalletQuery) {
    setQuery(savedQuery);
    runScan(1, savedQuery);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <ScanFilters
        query={query}
        onChange={setQuery}
        onScan={handleScan}
        onClear={handleClear}
        disabled={isScanning}
      />

      <SavedScans query={query} onApply={handleApplySavedSearch} disabled={isScanning} />

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}{' '}
          {needsAuth && (
            <span className="ml-2 inline-flex">
              <ConnectWalletButton />
            </span>
          )}
        </div>
      )}

      {hasScanned && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t('resultCount', { count: total || wallets.length })}
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={selected.length === 0}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('addToGroup', { count: selected.length })}
          </Button>
        </div>
      )}

      {isScanning && wallets.length === 0 ? (
        <div className="text-muted-foreground flex items-center justify-center py-12">
          <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
          {t('scanning')}
        </div>
      ) : hasScanned ? (
        <>
          <WalletTable wallets={wallets} selectable selected={selected} onSelect={setSelected} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => runScan(p, query)}
            disabled={isScanning}
          />
        </>
      ) : null}

      <AddToGroupModal
        open={addOpen}
        onOpenChange={setAddOpen}
        walletIds={selected}
        defaultGroupId={groupParam}
        onSuccess={() => setSelected([])}
      />
    </div>
  );
}
