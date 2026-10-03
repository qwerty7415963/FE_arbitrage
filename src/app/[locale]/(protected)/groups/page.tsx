'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { listTraderGroups } from '@/services/traders';
import type { TraderGroup } from '@/types/trader';
import { Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { GroupForm } from './_components/group-form';
import { DeleteGroupDialog } from './_components/delete-group-dialog';

export default function GroupsPage() {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');

  const [groups, setGroups] = useState<TraderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TraderGroup | null>(null);
  const [deleting, setDeleting] = useState<TraderGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNeedsAuth(false);
    try {
      setGroups(await listTraderGroups());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setNeedsAuth(true);
        setError(t('authRequired'));
      } else if (err instanceof ApiError && err.code === 'AUTH-005') {
        setNeedsAuth(true);
        setError(t('authRequired'));
      } else if (err instanceof ApiError && err.status === 403) {
        setError(t('forbidden'));
      } else {
        setError(err instanceof Error ? err.message : t('unknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    async function load() {
      await fetchGroups();
    }
    load();
  }, [fetchGroups]);

  function handleFormSuccess(saved: TraderGroup) {
    setGroups((prev) => {
      const exists = prev.some((g) => g.id === saved.id);
      return exists ? prev.map((g) => (g.id === saved.id ? saved : g)) : [saved, ...prev];
    });
  }

  function handleDeleteSuccess(id: string) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          {t('create')}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}{' '}
          {needsAuth ? (
            <span className="ml-2 inline-flex">
              <ConnectWalletButton />
            </span>
          ) : (
            <Button variant="link" size="sm" onClick={fetchGroups}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : groups.length === 0 && !error ? (
        <div className="text-muted-foreground py-12 text-center">
          <p>{t('empty')}</p>
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
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{t('name')}</th>
                <th className="p-2">{t('description')}</th>
                <th className="p-2">{t('walletCount')}</th>
                <th className="p-2 text-right">{tCommon('edit')}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">
                    <Link href={`/groups/${group.id}`} className="text-primary hover:underline">
                      {group.name}
                    </Link>
                  </td>
                  <td className="text-muted-foreground p-2">{group.description ?? '—'}</td>
                  <td className="p-2">{group.member_count}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${t('edit')} ${group.name}`}
                        onClick={() => {
                          setEditing(group);
                          setFormOpen(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${t('delete')} ${group.name}`}
                        onClick={() => {
                          setDeleting(group);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading && groups.length > 0 && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          {tCommon('loading')}
        </div>
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
