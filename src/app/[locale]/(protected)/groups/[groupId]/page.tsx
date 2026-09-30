'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { getGroup, listGroupWallets } from '@/services/groups';
import { removeWalletsFromGroup } from '@/services/wallets';
import { useAuthStore } from '@/lib/stores/auth';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import type { Group } from '@/types/wallet-group';
import type { GroupWallet, Wallet } from '@/types/wallet-scan';
import { PencilIcon, RadarIcon, Trash2Icon } from 'lucide-react';
import { GroupForm } from '../_components/group-form';
import { DeleteGroupDialog } from '../_components/delete-group-dialog';
import { WalletTable } from '@/components/shared/wallets/wallet-table';
import { Pagination } from '@/app/[locale]/(public)/funding-arbitrage/pagination';

const PAGE_SIZE = 10;

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const t = useTranslations('groups');
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchGroup = useCallback(async () => {
    setIsLoadingGroup(true);
    setGroupError(null);
    try {
      setGroup(await getGroup(groupId));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setGroupError(t('forbidden'));
        else if (err.status === 404) setGroupError(t('notFound'));
        else setGroupError(err.message);
      } else {
        setGroupError(err instanceof Error ? err.message : t('unknownError'));
      }
    } finally {
      setIsLoadingGroup(false);
    }
  }, [groupId, t]);

  const fetchWallets = useCallback(
    async (page: number, searchText: string) => {
      setIsLoadingWallets(true);
      setWalletsError(null);
      setNeedsAuth(false);
      try {
        const result = await listGroupWallets(groupId, {
          search: searchText || undefined,
          page,
          limit: PAGE_SIZE,
        });
        setWallets(result.data ?? []);
        setTotalPages(result.meta.total_pages ?? 1);
        setCurrentPage(result.meta.page ?? page);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setNeedsAuth(true);
          setWalletsError(t('authRequired'));
        } else {
          setWalletsError(err instanceof Error ? err.message : t('unknownError'));
        }
      } finally {
        setIsLoadingWallets(false);
      }
    },
    [groupId, t],
  );

  useEffect(() => {
    async function load() {
      await fetchGroup();
    }
    load();
  }, [fetchGroup]);

  useEffect(() => {
    async function load() {
      await fetchWallets(1, '');
    }
    load();
  }, [fetchWallets]);

  async function handleRemove(wallet: Wallet | GroupWallet) {
    if (!useAuthStore.getState().requireAuth()) return;
    try {
      await removeWalletsFromGroup(groupId, [wallet.id]);
      fetchWallets(currentPage, search);
      fetchGroup();
    } catch (err) {
      setWalletsError(err instanceof Error ? err.message : t('unknownError'));
    }
  }

  if (isLoadingGroup) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {groupError ?? t('notFound')}{' '}
          <Button variant="link" size="sm" onClick={fetchGroup}>
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground text-sm">{group.description}</p>
          )}
          <p className="text-muted-foreground text-sm">
            {t('walletCount')}: {group.wallet_count}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <PencilIcon className="mr-2 h-4 w-4" />
            {t('edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon className="mr-2 h-4 w-4" />
            {t('delete')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchWallets(1, search);
          }}
          placeholder={t('searchPlaceholder')}
          className="w-56"
        />
        <Button size="sm" onClick={() => fetchWallets(1, search)} disabled={isLoadingWallets}>
          {t('search')}
        </Button>
        <Link href={`/wallets?group=${group.id}`}>
          <Button variant="outline" size="sm">
            <RadarIcon className="mr-2 h-4 w-4" />
            {t('scanMore')}
          </Button>
        </Link>
      </div>

      {walletsError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {walletsError}{' '}
          {needsAuth ? (
            <span className="ml-2 inline-flex">
              <ConnectWalletButton />
            </span>
          ) : (
            <Button variant="link" size="sm" onClick={() => fetchWallets(currentPage, search)}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}

      {isLoadingWallets && wallets.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          <WalletTable
            wallets={wallets}
            renderActions={(w) => (
              <Button variant="ghost" size="icon-xs" onClick={() => handleRemove(w)}>
                <Trash2Icon className="h-4 w-4" />
              </Button>
            )}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => fetchWallets(p, search)}
            disabled={isLoadingWallets}
          />
        </>
      )}

      <GroupForm open={formOpen} onOpenChange={setFormOpen} group={group} onSuccess={setGroup} />
      <DeleteGroupDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        group={group}
        onSuccess={() => router.push('/groups')}
      />
    </div>
  );
}
