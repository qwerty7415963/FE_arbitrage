'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { listTraderGroups, updateTraderGroup } from '@/services/traders';
import type { TraderGroup } from '@/types/trader';
import { useTelegramStatus } from '@/hooks/use-telegram';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { useAuthStore } from '@/lib/stores/auth';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
import { GroupForm } from './_components/group-form';
import { DeleteGroupDialog } from './_components/delete-group-dialog';

export default function GroupsPage() {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setConnectModalOpen = useAuthStore((s) => s.setConnectModalOpen);
  const telegramStatus = useTelegramStatus({ enabled: isAuthenticated });

  const [groups, setGroups] = useState<TraderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TraderGroup | null>(null);
  const [deleting, setDeleting] = useState<TraderGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const gate = useAuthGate({ isAuthenticated, isLoading, error });

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setGroups(await listTraderGroups());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const errorMessage =
    error instanceof ApiError && error.status === 403
      ? t('forbidden')
      : error instanceof Error
        ? error.message
        : t('unknownError');

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) {
        setGroups([]);
        setError(null);
        setIsLoading(false);
        return;
      }
      await fetchGroups();
    }
    load();
  }, [fetchGroups, isAuthenticated]);

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

      {gate === 'unauthenticated' ? (
        <div className="text-muted-foreground py-12 text-center">
          <p>{t('authRequired')}</p>
          <div className="mt-4 inline-flex">
            <ConnectWalletButton />
          </div>
        </div>
      ) : (
        <>
          {error ? (
            gate === 'expired' ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
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
                    <th className="p-2">{t('receiveNotifications')}</th>
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
                        <div className="flex flex-col gap-1">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label={t('receiveNotifications')}
                              aria-checked={group.notify_enabled}
                              checked={group.notify_enabled}
                              disabled={!telegramStatus.data?.connected}
                              onChange={async (e) => {
                                if (!telegramStatus.data?.connected) return;
                                try {
                                  const updated = await updateTraderGroup(group.id, {
                                    notify_enabled: e.target.checked,
                                  });
                                  setGroups((prev) =>
                                    prev.map((g) => (g.id === updated.id ? updated : g)),
                                  );
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : t('unknownError'));
                                }
                              }}
                            />
                            <span>{t('receiveNotifications')}</span>
                          </label>
                          {!telegramStatus.data?.connected && (
                            <span className="text-muted-foreground text-xs">
                              {t('telegramNotConnectedHint')}
                            </span>
                          )}
                        </div>
                      </td>
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
