'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import { getGroupsOverview, listTraderGroupsDetailed, updateTraderGroup } from '@/services/traders';
import type { GroupListItem, GroupsOverview, TraderGroup } from '@/types/trader';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { useAuthStore } from '@/lib/stores/auth';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { useRouter } from '@/i18n/navigation';
import { cn } from 'cn';
import { GroupForm } from './_components/group-form';
import { DeleteGroupDialog } from './_components/delete-group-dialog';
import { GroupsOverviewStats } from './_components/groups-overview-stats';
import { GroupsTable } from './_components/groups-table';
import { FollowingSection } from './_components/following-section';
import { GroupsMobileList } from './_components/groups-mobile-list';

export default function GroupsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GroupsPageContent />
    </Suspense>
  );
}

function GroupsPageContent() {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const te = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setConnectModalOpen = useAuthStore((s) => s.setConnectModalOpen);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams?.get('view') === 'groups' ? 'groups' : 'following';
  function setView(next: 'following' | 'groups') {
    const navigate = router.replace ?? router.push;
    navigate(`/groups?view=${next}`, { scroll: false });
  }

  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [overview, setOverview] = useState<GroupsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('name');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; page: number; total_pages: number }>({
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TraderGroup | null>(null);
  const [deleting, setDeleting] = useState<TraderGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const gate = useAuthGate({ isAuthenticated, isLoading, error });

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listTraderGroupsDetailed({
        search,
        status: statusFilter || undefined,
        sort,
        dir,
        page,
        page_size: 20,
      });
      setGroups(list.items);
      setMeta({
        total: list.meta.total ?? 0,
        page: list.meta.page ?? page,
        total_pages: list.meta.total_pages ?? 1,
      });
      try {
        setOverview(await getGroupsOverview('30D'));
      } catch {
        // Overview is optional; keep the list usable when it fails.
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sort, dir, page]);

  const errorMessage =
    error instanceof ApiError && error.status === 403
      ? t('forbidden')
      : error instanceof ApiError
        ? te(mapErrorCode(error.code), { defaultValue: te('errors.unknown') })
        : t('unknownError');

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) {
        setGroups([]);
        setError(null);
        setIsLoading(false);
        return;
      }
      if (activeView !== 'groups') return;
      await fetchGroups();
    }
    load();
  }, [fetchGroups, isAuthenticated, activeView]);

  function handleFormSuccess() {
    void fetchGroups();
  }

  function handleDeleteSuccess() {
    void fetchGroups();
  }

  async function handleToggleFavorite(id: string, next: boolean) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, is_favorite: next } : g)));
    try {
      await updateTraderGroup(id, { is_favorite: next });
    } catch {
      void fetchGroups();
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {gate === 'unauthenticated' ? (
        <div className="text-muted-foreground py-12 text-center">
          <p>{t('authRequired')}</p>
          <div className="mt-4 inline-flex">
            <ConnectWalletButton />
          </div>
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t('title')}
            className="flex w-full gap-2 rounded-lg border p-1 lg:w-auto lg:rounded-none lg:border-0 lg:border-b lg:p-0"
          >
            {(['following', 'groups'] as const).map((view) => {
              const label = view === 'following' ? t('followingTab') : t('groupsTab');
              const active = activeView === view;
              return (
                <button
                  key={view}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(view)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors lg:flex-none lg:rounded-none lg:border-b-2 lg:px-4 lg:py-2',
                    active
                      ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground lg:bg-transparent'
                      : 'text-muted-foreground hover:text-foreground lg:border-transparent',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className={cn(activeView === 'following' ? '' : 'hidden')}>
            <FollowingSection />
          </div>

          <div className={cn(activeView === 'groups' ? '' : 'hidden')}>
            {error ? (
              gate === 'expired' ? (
                <div className="border-warning/30 bg-warning-subtle text-warning rounded-md border p-3 text-sm">
                  {t('sessionExpired')}{' '}
                  <Button variant="link" size="sm" onClick={() => setConnectModalOpen(true)}>
                    {tCommon('reconnect')}
                  </Button>
                </div>
              ) : (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {errorMessage}{' '}
                  <Button variant="link" size="sm" onClick={fetchGroups}>
                    {t('retry')}
                  </Button>
                </div>
              )
            ) : null}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('groupsTab')}</h2>
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                {t('create')}
              </Button>
            </div>

            <GroupsOverviewStats
              totalGroups={overview?.total_groups ?? meta.total}
              uniqueWallets={overview?.unique_wallets ?? 0}
              accountValue={overview?.account_value ?? null}
              unrealizedPnl={overview?.unrealized_pnl ?? null}
              partial={overview?.partial ?? false}
              isLoading={isLoading && groups.length === 0}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('searchGroups')}
                className="h-8 w-56"
              />
              <select
                aria-label={t('filterStatus')}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-background h-8 rounded-md border px-2 text-sm"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="ready">{t('statusReady')}</option>
                <option value="partial">{t('statusPartial')}</option>
                <option value="stale">{t('statusStale')}</option>
                <option value="empty">{t('statusEmpty')}</option>
                <option value="error">{t('statusError')}</option>
              </select>
              <select
                aria-label={t('sortBy')}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-background h-8 rounded-md border px-2 text-sm"
              >
                <option value="name">{t('name')}</option>
                <option value="account_value">{t('accountValue')}</option>
                <option value="unrealized_pnl">{t('unrealizedPnl')}</option>
                <option value="roi">{t('roi')}</option>
                <option value="volume">{t('volume')}</option>
                <option value="open_positions">{t('openPositions')}</option>
                <option value="win_rate">{t('winRate')}</option>
                <option value="updated_at">{t('updated')}</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                aria-label="sort direction"
                onClick={() => {
                  setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  setPage(1);
                }}
              >
                {dir === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            {groups.length === 0 && !isLoading && !error ? (
              <div className="text-muted-foreground py-12 text-center">
                <p>{t('noGroups')}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  {t('create')}
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <GroupsTable
                    groups={groups}
                    isLoading={isLoading && groups.length === 0}
                    onToggleFavorite={handleToggleFavorite}
                    onRowClick={(g) => router.push(`/groups/${g.id}`)}
                    onEdit={(g: GroupListItem) => {
                      setEditing(g as unknown as TraderGroup);
                      setFormOpen(true);
                    }}
                    onDelete={(g: GroupListItem) => {
                      setDeleting(g as unknown as TraderGroup);
                      setDeleteOpen(true);
                    }}
                  />
                </div>
                <GroupsMobileList
                  groups={groups}
                  onRowClick={(g) => router.push(`/groups/${g.id}`)}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(g) => {
                    setEditing(g as unknown as TraderGroup);
                    setFormOpen(true);
                  }}
                  onDelete={(g) => {
                    setDeleting(g as unknown as TraderGroup);
                    setDeleteOpen(true);
                  }}
                />
              </>
            )}

            {meta.total_pages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <span className="text-muted-foreground">
                  {meta.page} / {meta.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <GroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editing}
        onSuccess={handleFormSuccess}
      />
      <DeleteGroupDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        group={deleting}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
