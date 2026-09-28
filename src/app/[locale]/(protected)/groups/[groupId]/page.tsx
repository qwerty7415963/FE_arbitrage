'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { getGroup } from '@/services/groups';
import type { Group } from '@/types/wallet-group';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { GroupForm } from '../_components/group-form';
import { DeleteGroupDialog } from '../_components/delete-group-dialog';

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const t = useTranslations('groups');
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchGroup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setGroup(await getGroup(params.groupId));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setError(t('forbidden'));
        else if (err.status === 404) setError(t('notFound'));
        else setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : t('unknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.groupId, t]);

  useEffect(() => {
    async function load() {
      await fetchGroup();
    }
    load();
  }, [fetchGroup]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error ?? t('notFound')}{' '}
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

      <div className="text-muted-foreground rounded-lg border p-4 text-sm">
        {t('walletsComingSoon')}
      </div>

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
