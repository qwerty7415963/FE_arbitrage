'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import {
  getTraderGroup,
  listGroupMembers,
  removeGroupMembers,
  updateGroupMembers,
} from '@/services/traders';
import { useAuthStore } from '@/lib/stores/auth';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { CopyAddress } from '@/components/shared/traders/copy-address';
import { NULL_DISPLAY } from '@/components/shared/traders/trader-table';
import { formatDecimal, formatPercent, formatSignedPercent, formatUsd } from '@/lib/trader-format';
import type { TraderGroup, TraderMember } from '@/types/trader';
import { CheckIcon, PencilIcon, RadarIcon, Trash2Icon, XIcon } from 'lucide-react';
import { GroupForm } from '../_components/group-form';
import { DeleteGroupDialog } from '../_components/delete-group-dialog';
import { Pagination } from '@/components/shared/pagination';

const PAGE_SIZE = 10;

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const t = useTranslations('groups');
  const tt = useTranslations('traders');
  const router = useRouter();
  const [group, setGroup] = useState<TraderGroup | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<TraderMember[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editAlias, setEditAlias] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchGroup = useCallback(async () => {
    setIsLoadingGroup(true);
    setGroupError(null);
    try {
      setGroup(await getTraderGroup(groupId));
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

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    setNeedsAuth(false);
    try {
      setMembers(await listGroupMembers(groupId));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === 'AUTH-005')) {
        setNeedsAuth(true);
        setMembersError(t('authRequired'));
      } else {
        setMembersError(err instanceof Error ? err.message : t('unknownError'));
      }
    } finally {
      setIsLoadingMembers(false);
    }
  }, [groupId, t]);

  useEffect(() => {
    async function load() {
      await fetchGroup();
    }
    load();
  }, [fetchGroup]);

  useEffect(() => {
    async function load() {
      await fetchMembers();
    }
    load();
  }, [fetchMembers]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) =>
      [m.wallet_address, m.display_name, m.alias, m.note]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle)),
    );
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleRemove(member: TraderMember) {
    if (!useAuthStore.getState().requireAuth()) return;
    try {
      await removeGroupMembers(groupId, [
        { venue: member.venue, wallet_address: member.wallet_address },
      ]);
      fetchMembers();
      fetchGroup();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : t('unknownError'));
    }
  }

  function startEdit(member: TraderMember) {
    setEditingKey(`${member.venue}:${member.wallet_address}`);
    setEditAlias(member.alias ?? '');
    setEditNote(member.note ?? '');
    setMembersError(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditAlias('');
    setEditNote('');
  }

  async function saveEdit(member: TraderMember) {
    if (!useAuthStore.getState().requireAuth()) return;
    setIsSavingEdit(true);
    try {
      await updateGroupMembers(groupId, [
        {
          venue: member.venue,
          wallet_address: member.wallet_address,
          alias: editAlias.trim(),
          note: editNote.trim(),
        },
      ]);
      cancelEdit();
      fetchMembers();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsSavingEdit(false);
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
            {t('walletCount')}: {group.member_count}
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
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder={t('searchPlaceholder')}
          className="w-56"
        />
        <Link href={`/traders?group=${group.id}`}>
          <Button variant="outline" size="sm">
            <RadarIcon className="mr-2 h-4 w-4" />
            {t('scanMore')}
          </Button>
        </Link>
      </div>

      {membersError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {membersError}{' '}
          {needsAuth ? (
            <span className="ml-2 inline-flex">
              <ConnectWalletButton />
            </span>
          ) : (
            <Button variant="link" size="sm" onClick={fetchMembers}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}

      {isLoadingMembers && members.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : visible.length === 0 && !membersError ? (
        <div className="text-muted-foreground py-8 text-center text-sm">{t('noMembers')}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{t('member')}</th>
                  <th className="p-2">{t('venue')}</th>
                  <th className="p-2">{t('alias')}</th>
                  <th className="p-2">{tt('colRoi')}</th>
                  <th className="p-2">{tt('colPnl')}</th>
                  <th className="p-2">{tt('colWinRate')}</th>
                  <th className="p-2">{tt('colProfitFactor')}</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => {
                  const key = `${m.venue}:${m.wallet_address}`;
                  const isEditing = editingKey === key;
                  return (
                    <tr key={key} className="border-b last:border-0">
                      <td className="p-2">
                        {m.display_name && <div className="font-medium">{m.display_name}</div>}
                        <CopyAddress address={m.wallet_address} />
                      </td>
                      <td className="p-2">{m.venue}</td>
                      <td className="text-muted-foreground p-2">
                        {isEditing ? (
                          <div
                            className="flex flex-col gap-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          >
                            <Input
                              aria-label={`${t('alias')} ${m.wallet_address}`}
                              value={editAlias}
                              maxLength={100}
                              placeholder={t('alias')}
                              className="h-8"
                              disabled={isSavingEdit}
                              onChange={(e) => setEditAlias(e.target.value)}
                            />
                            <Input
                              aria-label={`${t('note')} ${m.wallet_address}`}
                              value={editNote}
                              maxLength={500}
                              placeholder={t('note')}
                              className="h-8"
                              disabled={isSavingEdit}
                              onChange={(e) => setEditNote(e.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <div>{m.alias ?? '—'}</div>
                            {m.note && <div className="text-xs">{m.note}</div>}
                          </>
                        )}
                      </td>
                      <td className="p-2">{formatSignedPercent(m.metrics?.roi) ?? NULL_DISPLAY}</td>
                      <td className="p-2">
                        {m.metrics?.pnl === null || m.metrics?.pnl === undefined
                          ? NULL_DISPLAY
                          : `${m.metrics.pnl > 0 ? '+' : ''}${formatUsd(m.metrics.pnl)}`}
                      </td>
                      <td className="p-2">{formatPercent(m.metrics?.win_rate) ?? NULL_DISPLAY}</td>
                      <td className="p-2">
                        {formatDecimal(m.metrics?.profit_factor) ?? NULL_DISPLAY}
                      </td>
                      <td className="p-2 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={t('save')}
                              disabled={isSavingEdit}
                              onClick={() => saveEdit(m)}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={t('cancel')}
                              disabled={isSavingEdit}
                              onClick={cancelEdit}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`${t('editMember')} ${m.wallet_address}`}
                              onClick={() => startEdit(m)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={t('removeMember')}
                              onClick={() => handleRemove(m)}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            disabled={isLoadingMembers}
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
