'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from 'cn';
import {
  formatPercent,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import { useFollowedWallets, useFollowMutations } from '@/hooks/use-follows';
import { AddToTraderGroupModal } from '@/components/shared/traders/add-to-trader-group-modal';
import type { FollowedWallet, MemberInput } from '@/types/trader';
import { BellIcon, BellOffIcon, UserPlusIcon, XIcon } from 'lucide-react';

export function FollowingSection() {
  const t = useTranslations('groups');
  const tf = useTranslations('traders');
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [addMembers, setAddMembers] = useState<MemberInput[]>([]);

  const { data, isLoading } = useFollowedWallets({
    search: search || undefined,
    page,
    page_size: 20,
    sort: 'followed_at',
    dir: 'desc',
  });
  const { unfollow, toggleNotify } = useFollowMutations();

  const items = data?.items ?? [];

  function openAdd(row: FollowedWallet) {
    setAddMembers([{ venue: row.venue, wallet_address: row.wallet_address }]);
    setAddOpen(true);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('followingTitle', { default: 'Following' })}</h2>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('searchGroups')}
            className="h-8 w-48"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          {t('noFollowing', { default: 'No followed wallets yet.' })}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Wallet</th>
                  <th className="p-2 text-right">PnL</th>
                  <th className="p-2 text-right">ROI</th>
                  <th className="p-2 text-right">Win rate</th>
                  <th className="p-2">Groups</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const pnlTone =
                    (row.pnl ?? 0) >= 0 ? 'text-financial-positive' : 'text-destructive';
                  return (
                    <tr
                      key={`${row.venue}:${row.wallet_address}`}
                      className="border-b last:border-0"
                    >
                      <td className="p-2">
                        <div className="font-medium">
                          {row.alias ?? row.display_name ?? row.wallet_address.slice(0, 8) + '…'}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {row.wallet_address.slice(0, 6)}…{row.wallet_address.slice(-4)}
                        </div>
                      </td>
                      <td className={cn('p-2 text-right tabular-nums', pnlTone)}>
                        {row.pnl === null ? '—' : `${row.pnl > 0 ? '+' : ''}${formatUsd(row.pnl)}`}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatSignedPercent(row.roi)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatPercent(row.win_rate) ?? '—'}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {row.in_groups.map((g) => (
                            <span key={g} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={row.notify_enabled ? 'Mute alerts' : 'Enable alerts'}
                            onClick={() =>
                              toggleNotify.mutate({
                                venue: row.venue,
                                address: row.wallet_address,
                                notifyEnabled: !row.notify_enabled,
                              })
                            }
                            className="hover:bg-muted rounded p-1"
                          >
                            {row.notify_enabled ? (
                              <BellIcon className="h-4 w-4" />
                            ) : (
                              <BellOffIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Add to group"
                            onClick={() => openAdd(row)}
                            className="hover:bg-muted rounded p-1"
                          >
                            <UserPlusIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Unfollow"
                            onClick={() =>
                              unfollow.mutate([
                                { venue: row.venue, wallet_address: row.wallet_address },
                              ])
                            }
                            className="hover:bg-muted rounded p-1"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 lg:hidden">
            {items.map((row) => {
              const pnlTone = (row.pnl ?? 0) >= 0 ? 'text-financial-positive' : 'text-destructive';
              return (
                <li
                  key={`${row.venue}:${row.wallet_address}`}
                  className="bg-surface border-border-subtle rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {row.alias ?? row.display_name ?? row.wallet_address.slice(0, 8) + '…'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {row.wallet_address.slice(0, 6)}…{row.wallet_address.slice(-4)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('font-semibold tabular-nums', pnlTone)}>
                        {row.pnl === null ? '—' : `${row.pnl > 0 ? '+' : ''}${formatUsd(row.pnl)}`}
                      </div>
                      <div className="text-muted-foreground text-xs tabular-nums">
                        {formatSignedPercent(row.roi)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.in_groups.map((g) => (
                      <span key={g} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        toggleNotify.mutate({
                          venue: row.venue,
                          address: row.wallet_address,
                          notifyEnabled: !row.notify_enabled,
                        })
                      }
                      className="hover:bg-muted rounded p-2"
                    >
                      {row.notify_enabled ? (
                        <BellIcon className="h-4 w-4" />
                      ) : (
                        <BellOffIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openAdd(row)}
                      className="hover:bg-muted rounded p-2"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        unfollow.mutate([{ venue: row.venue, wallet_address: row.wallet_address }])
                      }
                      className="hover:bg-muted rounded p-2"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <AddToTraderGroupModal
        open={addOpen}
        onOpenChange={setAddOpen}
        members={addMembers}
        onSuccess={() => setAddOpen(false)}
      />
    </section>
  );
}
