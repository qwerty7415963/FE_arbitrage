'use client';

import { useTranslations } from 'next-intl';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatUsd,
  formatSignedUsd,
  formatPercent,
  formatSignedPercent,
} from '@/lib/trader-format';
import type { GroupListItem } from '@/types/trader';

export interface GroupsTableProps {
  groups: GroupListItem[];
  isLoading?: boolean;
  onToggleFavorite: (id: string, next: boolean) => void;
  onEdit?: (g: GroupListItem) => void;
  onDelete?: (g: GroupListItem) => void;
}

export function GroupsTable({
  groups,
  isLoading,
  onToggleFavorite,
  onEdit,
  onDelete,
}: GroupsTableProps) {
  const t = useTranslations('groups');
  if (isLoading)
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="p-2">{t('favorite')}</th>
          <th className="p-2">{t('name')}</th>
          <th className="p-2 text-right">{t('walletCount')}</th>
          <th className="p-2 text-right">{t('accountValue')}</th>
          <th className="p-2 text-right">{t('unrealizedPnl')}</th>
          <th className="p-2 text-right">{t('roi')}</th>
          <th className="p-2 text-right">{t('volume')}</th>
          <th className="p-2 text-right">{t('openPositions')}</th>
          <th className="p-2 text-right">{t('winRate')}</th>
          <th className="p-2 text-right">{t('updated')}</th>
          <th className="p-2 text-right">{t('actions')}</th>
        </tr>
      </thead>
      <tbody>
        {groups.length === 0 ? (
          <tr>
            <td colSpan={11} className="text-muted-foreground p-2 text-center">
              {t('noGroups')}
            </td>
          </tr>
        ) : (
          groups.map((row) => {
            const favorite = !!row.is_favorite;
            return (
              <tr key={row.id} className="border-b">
                <td className="p-2">
                  <button
                    type="button"
                    aria-label={t('favorite')}
                    onClick={() => onToggleFavorite(row.id, !favorite)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Star className={cn('h-4 w-4', favorite && 'fill-current text-amber-500')} />
                  </button>
                </td>
                <td className="p-2" title={t('description')}>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-muted-foreground text-xs">{row.description ?? '—'}</div>
                </td>
                <td className="p-2 text-right tabular-nums">{row.member_count}</td>
                <td className="p-2 text-right tabular-nums">
                  {formatUsd(row.account_value) ?? '—'}
                </td>
                <td
                  className={cn(
                    'p-2 text-right tabular-nums',
                    (row.unrealized_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-destructive',
                  )}
                >
                  {formatSignedUsd(row.unrealized_pnl)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatSignedPercent(row.roi != null ? row.roi * 100 : null) ?? '—'}
                </td>
                <td className="p-2 text-right tabular-nums">{formatUsd(row.volume) ?? '—'}</td>
                <td className="p-2 text-right tabular-nums">{row.open_positions}</td>
                <td className="p-2 text-right tabular-nums">
                  {formatPercent(row.win_rate != null ? row.win_rate * 100 : null) ?? '—'}
                </td>
                <td className="text-muted-foreground p-2 text-right text-xs">
                  {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`${t('edit')} ${row.name}`}
                      onClick={() => onEdit?.(row)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t('delete')} ${row.name}`}
                      onClick={() => onDelete?.(row)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export default GroupsTable;
