'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import {
  getGroupPositions,
  getGroupStats,
  getTraderGroup,
  listGroupMembers,
  removeGroupMembers,
  updateGroupMembers,
  updateTraderGroup,
} from '@/services/traders';
import { useAuthStore } from '@/lib/stores/auth';
import { useFollowMutations } from '@/hooks/use-follows';
import { useTelegramStatus } from '@/hooks/use-telegram';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { CopyAddress } from '@/components/shared/traders/copy-address';
import { NULL_DISPLAY } from '@/components/shared/traders/trader-table';
import {
  formatDecimal,
  formatPercent,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import type { GroupPositionsResponse, GroupStats, TraderGroup, TraderMember } from '@/types/trader';
import {
  CheckIcon,
  PencilIcon,
  RadarIcon,
  Trash2Icon,
  XIcon,
  UserRoundCheckIcon,
  UserRoundPlusIcon,
} from 'lucide-react';
import { GroupForm } from '../_components/group-form';
import { DeleteGroupDialog } from '../_components/delete-group-dialog';
import { GroupPerformanceChart } from './_components/group-performance-chart';
import { GroupExposure } from './_components/group-exposure';
import { GroupActivityTimeline } from './_components/group-activity-timeline';
import { GroupAlertsPanel } from './_components/group-alerts-panel';
import { Pagination } from '@/components/shared/pagination';

const PAGE_SIZE = 10;

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const t = useTranslations('groups');
  const tt = useTranslations('traders');
  const tc = useTranslations('common');
  const te = useTranslations();
  const router = useRouter();
  const { follow, unfollow } = useFollowMutations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setConnectModalOpen = useAuthStore((s) => s.setConnectModalOpen);
  const [group, setGroup] = useState<TraderGroup | null>(null);
  const telegramStatus = useTelegramStatus({ enabled: isAuthenticated });
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState<unknown>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [followFilter, setFollowFilter] = useState<'all' | 'following' | 'not_following'>('all');
  const [members, setMembers] = useState<TraderMember[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editAlias, setEditAlias] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'overview' | 'positions' | 'members' | 'activity' | 'alerts'>(
    () => {
      const t = searchParams?.get('tab') ?? null;
      if (
        t === 'overview' ||
        t === 'positions' ||
        t === 'members' ||
        t === 'activity' ||
        t === 'alerts'
      ) {
        return t;
      }
      return 'overview';
    },
  );
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [statsFetchedAt, setStatsFetchedAt] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<unknown>(null);
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [statsPeriod, setStatsPeriod] = useState<'1D' | '7D' | '30D' | '90D' | 'ALL'>('30D');
  const [positions, setPositions] = useState<GroupPositionsResponse | null>(null);
  const [expandedCoins, setExpandedCoins] = useState<Set<string>>(new Set());
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<unknown>(null);
  const groupGate = useAuthGate({
    isAuthenticated,
    isLoading: isLoadingGroup,
    error: groupError,
  });
  const membersGate = useAuthGate({
    isAuthenticated,
    isLoading: isLoadingMembers,
    error: membersError,
  });

  const fetchGroup = useCallback(async () => {
    setIsLoadingGroup(true);
    setGroupError(null);
    try {
      setGroup(await getTraderGroup(groupId));
    } catch (err) {
      setGroupError(err);
    } finally {
      setIsLoadingGroup(false);
    }
  }, [groupId]);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      setMembers(await listGroupMembers(groupId));
    } catch (err) {
      setMembersError(err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [groupId]);

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) {
        setGroup(null);
        setGroupError(null);
        setIsLoadingGroup(false);
        return;
      }
      await fetchGroup();
    }
    load();
  }, [fetchGroup, isAuthenticated]);

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) {
        setMembers([]);
        setMembersError(null);
        setIsLoadingMembers(false);
        return;
      }
      await fetchMembers();
    }
    load();
  }, [fetchMembers, isAuthenticated]);

  useEffect(() => {
    async function loadStats() {
      if (!isAuthenticated) {
        setGroupStats(null);
        setStatsError(null);
        return;
      }
      setIsLoadingStats(true);
      setStatsError(null);
      try {
        const s = await getGroupStats(groupId, statsPeriod);
        setGroupStats(s);
        setStatsFetchedAt(Date.now());
      } catch (err) {
        setGroupStats(null);
        setStatsError(err);
      } finally {
        setIsLoadingStats(false);
      }
    }
    loadStats();
  }, [groupId, isAuthenticated, statsPeriod, statsRefresh]);

  useEffect(() => {
    async function loadPositions() {
      if (!isAuthenticated) {
        setPositions(null);
        return;
      }
      setIsLoadingPositions(true);
      try {
        setPositions(await getGroupPositions(groupId));
      } catch {
        setPositions(null);
      } finally {
        setIsLoadingPositions(false);
      }
    }
    loadPositions();
  }, [groupId, isAuthenticated]);

  const filtered = useMemo(() => {
    let list = members;
    if (followFilter === 'following') list = list.filter((m) => m.is_followed);
    if (followFilter === 'not_following') list = list.filter((m) => !m.is_followed);
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((m) =>
      [m.wallet_address, m.display_name, m.alias, m.note]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle)),
    );
  }, [members, search, followFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groupErrorMessage =
    groupError instanceof ApiError
      ? groupError.status === 403
        ? t('forbidden')
        : groupError.status === 404
          ? t('notFound')
          : te(mapErrorCode(groupError.code), { defaultValue: te('errors.unknown') })
      : typeof groupError === 'string'
        ? groupError
        : t('unknownError');

  const membersErrorMessage =
    membersError instanceof ApiError
      ? te(mapErrorCode(membersError.code), { defaultValue: te('errors.unknown') })
      : typeof membersError === 'string'
        ? membersError
        : t('unknownError');

  async function handleToggleNotify(next: boolean) {
    if (!group) return;
    if (!telegramStatus.data?.connected) return;
    try {
      const updated = await updateTraderGroup(group.id, { notify_enabled: next });
      setGroup(updated);
    } catch (err) {
      setGroupError(err);
    }
  }

  async function handleRemove(member: TraderMember) {
    if (!useAuthStore.getState().requireAuth()) return;
    try {
      await removeGroupMembers(groupId, [
        { venue: member.venue, wallet_address: member.wallet_address },
      ]);
      fetchMembers();
      fetchGroup();
    } catch (err) {
      setMembersError(err);
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
      setMembersError(err);
    } finally {
      setIsSavingEdit(false);
    }
  }

  if (isLoadingGroup) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (groupGate === 'expired') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="border-warning/30 bg-warning-subtle text-warning rounded-md border p-3 text-sm">
          {t('sessionExpired')}{' '}
          <Button variant="link" size="sm" onClick={() => setConnectModalOpen(true)}>
            {tc('reconnect')}
          </Button>
        </div>
      </div>
    );
  }

  if (groupGate === 'unauthenticated') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="text-muted-foreground py-12 text-center">
          <p>{t('authRequired')}</p>
          <div className="mt-4 inline-flex">
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {groupError ? groupErrorMessage : t('notFound')}{' '}
          <Button variant="link" size="sm" onClick={fetchGroup}>
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground text-sm">{group.description}</p>
          )}
          <p className="text-muted-foreground text-sm">
            {t('walletCount')}: {group.member_count}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="bg-muted rounded-full px-2 py-0.5">
              {t('status')}: {groupStats?.data_status ?? '—'}
            </span>
            {groupStats?.as_of ? (
              <span className="text-muted-foreground">
                {t('updatedAgo', {
                  minutes: Math.max(
                    0,
                    Math.round(
                      ((statsFetchedAt ?? 0) - Date.parse(groupStats.as_of ?? '')) / 60000,
                    ),
                  ),
                })}
              </span>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setStatsRefresh((n) => n + 1)}>
              {t('refresh')}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              role="switch"
              aria-label={t('receiveNotifications')}
              aria-checked={group?.notify_enabled ?? false}
              checked={group?.notify_enabled ?? false}
              disabled={!telegramStatus.data?.connected}
              onChange={(e) => handleToggleNotify(e.target.checked)}
            />
            <span>{t('receiveNotifications')}</span>
          </label>
          {!telegramStatus.data?.connected && (
            <span className="text-muted-foreground text-xs">{t('telegramNotConnectedHint')}</span>
          )}
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

      <div
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto border-b pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t('title')}
      >
        {(['overview', 'positions', 'members', 'activity', 'alerts'] as const).map((id) => (
          <Button
            key={id}
            role="tab"
            aria-selected={tab === id}
            variant={tab === id ? 'default' : 'ghost'}
            size="sm"
            className="shrink-0"
            onClick={() => {
              setTab(id);
              router.replace(`/groups/${groupId}?tab=${id}`);
            }}
          >
            {t(id)}
          </Button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['1D', '7D', '30D', '90D', 'ALL'] as const).map((p) => (
              <Button
                key={p}
                variant={statsPeriod === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatsPeriod(p)}
              >
                {p === 'ALL' ? t('rangeAll') : p}
              </Button>
            ))}
          </div>
          <GroupExposure groupId={groupId} period={statsPeriod} />
          {isLoadingStats ? (
            <Skeleton className="h-20 w-full" />
          ) : statsError ? (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {t('unknownError')}{' '}
              <Button variant="link" size="sm" onClick={() => setStatsRefresh((n) => n + 1)}>
                {t('retry')}
              </Button>
            </div>
          ) : groupStats ? (
            <>
              <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                <span>
                  {t('status')}: {groupStats.data_status}
                </span>
                {groupStats.partial ? <span>{t('partialData')}</span> : null}
                <span>
                  {t('missingWallets') ?? 'Missing'}: {groupStats.missing_wallets}
                </span>
                <span>
                  {t('membersTotal') ?? 'Members'}: {groupStats.members_total}/
                  {groupStats.members_with_data}
                </span>
                <span>
                  {t('asOf') ?? 'As of'}: {groupStats.as_of ?? '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    [t('accountValue'), formatUsd(groupStats.account_value) ?? NULL_DISPLAY],
                    [
                      t('unrealizedPnl'),
                      groupStats.unrealized_pnl != null
                        ? formatSignedUsd(groupStats.unrealized_pnl)
                        : 'N/A',
                    ],
                    [t('realizedPnl'), formatSignedUsd(groupStats.realized_pnl)],
                    [
                      t('roi'),
                      formatSignedPercent(groupStats.roi != null ? groupStats.roi * 100 : null) ??
                        NULL_DISPLAY,
                    ],
                    [t('volume'), formatUsd(groupStats.volume) ?? NULL_DISPLAY],
                    [
                      t('winRate'),
                      groupStats.win_rate != null
                        ? groupStats.win_count != null && groupStats.loss_count != null
                          ? `${formatPercent(groupStats.win_rate * 100) ?? NULL_DISPLAY} (${groupStats.win_count}/${groupStats.win_count + groupStats.loss_count})`
                          : (formatPercent(groupStats.win_rate * 100) ?? NULL_DISPLAY)
                        : NULL_DISPLAY,
                    ],
                    [
                      t('profitFactor'),
                      groupStats.profit_factor != null
                        ? (formatDecimal(groupStats.profit_factor) ?? NULL_DISPLAY)
                        : t('profitFactorNa'),
                    ],
                    [t('maxDrawdown'), formatPercent(groupStats.max_drawdown_pct) ?? NULL_DISPLAY],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border p-2"
                    title={
                      label === t('unrealizedPnl') && groupStats.unrealized_pnl == null
                        ? t('upnlNaTooltip')
                        : undefined
                    }
                  >
                    <div className="text-muted-foreground text-xs">{label}</div>
                    <div className="font-medium tabular-nums">{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">{t('noMembers')}</div>
          )}
          <GroupPerformanceChart groupId={groupId} period={statsPeriod} />
        </div>
      )}

      {tab === 'positions' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{t('positions')}</h2>
            {isLoadingPositions ? (
              <Skeleton className="h-16 w-full" />
            ) : positions && positions.positions.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">{t('coin')}</th>
                      <th className="p-2 text-right">{t('longExposure')}</th>
                      <th className="p-2 text-right">{t('shortExposure')}</th>
                      <th className="p-2 text-right">{t('netExposure')}</th>
                      <th className="p-2 text-right">{t('grossNtl')}</th>
                      <th className="p-2 text-right">{t('unrealizedPnl')}</th>
                      <th className="p-2 text-right">{t('walletCount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.positions.map((p) => {
                      const expanded = expandedCoins.has(p.coin);
                      return (
                        <>
                          <tr
                            key={p.coin}
                            className="hover:bg-muted/40 cursor-pointer border-b last:border-0"
                            onClick={() =>
                              setExpandedCoins((prev) => {
                                const next = new Set(prev);
                                if (next.has(p.coin)) next.delete(p.coin);
                                else next.add(p.coin);
                                return next;
                              })
                            }
                          >
                            <td className="p-2 font-medium">{p.coin}</td>
                            <td className="p-2 text-right tabular-nums">
                              {formatUsd(p.long_ntl) ?? NULL_DISPLAY}
                            </td>
                            <td className="p-2 text-right tabular-nums">
                              {formatUsd(p.short_ntl) ?? NULL_DISPLAY}
                            </td>
                            <td className="p-2 text-right tabular-nums">
                              {formatUsd(p.net_ntl) ?? NULL_DISPLAY}
                            </td>
                            <td className="p-2 text-right tabular-nums">
                              {formatUsd(p.gross_ntl) ?? NULL_DISPLAY}
                            </td>
                            <td className="p-2 text-right tabular-nums">
                              {formatSignedUsd(p.unrealized_pnl)}
                            </td>
                            <td className="p-2 text-right tabular-nums">{p.wallet_count}</td>
                          </tr>
                          {expanded ? (
                            <tr key={`${p.coin}-wallets`} className="bg-muted/20">
                              <td colSpan={7} className="p-2">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b text-left">
                                      <th className="p-1">{t('walletsList')}</th>
                                      <th className="p-1">Side</th>
                                      <th className="p-1 text-right">Size</th>
                                      <th className="p-1 text-right">{t('entryPrice')}</th>
                                      <th className="p-1 text-right">{t('markPrice')}</th>
                                      <th className="p-1 text-right">{t('leverage')}</th>
                                      <th className="p-1 text-right">{t('liquidationPrice')}</th>
                                      <th className="p-1 text-right">
                                        {t('distanceToLiquidation')}
                                      </th>
                                      <th className="p-1 text-right">{t('size')}</th>
                                      <th className="p-1 text-right">{t('unrealizedPnl')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {p.wallets.map((w, idx) => (
                                      <tr
                                        key={`${w.wallet_address}-${idx}`}
                                        className="border-b last:border-0"
                                      >
                                        <td className="p-1">
                                          <Link
                                            href={`/traders/${w.wallet_address}`}
                                            className="hover:underline"
                                          >
                                            {w.wallet_address.slice(0, 6)}...
                                            {w.wallet_address.slice(-4)}
                                          </Link>
                                        </td>
                                        <td className="p-1">
                                          <span>{w.side}</span>
                                          {w.distance_to_liquidation_pct != null &&
                                          w.distance_to_liquidation_pct <= 10 ? (
                                            <span
                                              className={
                                                w.distance_to_liquidation_pct <= 5
                                                  ? 'bg-destructive/10 text-destructive ml-1 rounded px-1'
                                                  : 'bg-warning/10 text-warning ml-1 rounded px-1'
                                              }
                                            >
                                              {w.distance_to_liquidation_pct.toFixed(2)}%
                                            </span>
                                          ) : null}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">{w.size}</td>
                                        <td className="p-1 text-right tabular-nums">
                                          {formatUsd(w.entry_price) ?? NULL_DISPLAY}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">
                                          {formatUsd(w.mark_price) ?? NULL_DISPLAY}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">
                                          {w.leverage ?? NULL_DISPLAY}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">
                                          {formatUsd(w.liquidation_price) ?? NULL_DISPLAY}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">
                                          {w.distance_to_liquidation_pct != null
                                            ? `${w.distance_to_liquidation_pct.toFixed(2)}%`
                                            : NULL_DISPLAY}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">
                                          {formatUsd(w.position_value) ?? NULL_DISPLAY}
                                        </td>
                                        <td className="p-1 text-right tabular-nums">
                                          {formatSignedUsd(w.unrealized_pnl)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ) : null}
                        </>
                      );
                    })}
                    <tr className="bg-muted/30 border-t font-medium">
                      <td className="p-2">{t('totalNotional')}</td>
                      <td className="p-2 text-right tabular-nums">
                        {formatUsd(positions.totals.long_ntl) ?? NULL_DISPLAY}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatUsd(positions.totals.short_ntl) ?? NULL_DISPLAY}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatUsd(positions.totals.net_ntl) ?? NULL_DISPLAY}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatUsd(positions.totals.gross_ntl) ?? NULL_DISPLAY}
                      </td>
                      <td className="p-2 text-right tabular-nums">{NULL_DISPLAY}</td>
                      <td className="p-2 text-right tabular-nums">
                        {positions.totals.open_positions}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">{t('noOpenPositions')}</div>
            )}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <>
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
            <select
              aria-label="Follow filter"
              value={followFilter}
              onChange={(e) =>
                setFollowFilter(e.target.value as 'all' | 'following' | 'not_following')
              }
              className="bg-background h-8 rounded-md border px-2 text-sm"
            >
              <option value="all">All</option>
              <option value="following">Following</option>
              <option value="not_following">Not following</option>
            </select>
            <Link href={`/traders?group=${group.id}`}>
              <Button variant="outline" size="sm">
                <RadarIcon className="mr-2 h-4 w-4" />
                {t('scanMore')}
              </Button>
            </Link>
          </div>

          {membersError ? (
            membersGate === 'expired' ? (
              <div className="border-warning/30 bg-warning-subtle text-warning rounded-md border p-3 text-sm">
                {t('sessionExpired')}{' '}
                <Button variant="link" size="sm" onClick={() => setConnectModalOpen(true)}>
                  {tc('reconnect')}
                </Button>
              </div>
            ) : (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {membersErrorMessage}{' '}
                <Button variant="link" size="sm" onClick={fetchMembers}>
                  {t('retry')}
                </Button>
              </div>
            )
          ) : null}

          {isLoadingMembers && members.length === 0 ? (
            <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
              <Skeleton className="h-12 w-full" />
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
                          <td className="p-2">
                            {formatSignedPercent(m.metrics?.roi) ?? NULL_DISPLAY}
                          </td>
                          <td className="p-2">
                            {m.metrics?.pnl === null || m.metrics?.pnl === undefined
                              ? NULL_DISPLAY
                              : `${m.metrics.pnl > 0 ? '+' : ''}${formatUsd(m.metrics.pnl)}`}
                          </td>
                          <td className="p-2">
                            {formatPercent(m.metrics?.win_rate) ?? NULL_DISPLAY}
                          </td>
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
                                  aria-label={m.is_followed ? 'Unfollow' : 'Follow'}
                                  onClick={() => {
                                    if (m.is_followed) {
                                      unfollow.mutate([
                                        { venue: m.venue, wallet_address: m.wallet_address },
                                      ]);
                                    } else {
                                      follow.mutate({
                                        wallets: [
                                          { venue: m.venue, wallet_address: m.wallet_address },
                                        ],
                                      });
                                    }
                                  }}
                                >
                                  {m.is_followed ? (
                                    <UserRoundCheckIcon className="h-4 w-4" />
                                  ) : (
                                    <UserRoundPlusIcon className="h-4 w-4" />
                                  )}
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
        </>
      )}

      {tab === 'activity' && <GroupActivityTimeline groupId={groupId} />}

      {tab === 'alerts' && <GroupAlertsPanel groupId={groupId} />}

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
