'use client';

import { useTranslations } from 'next-intl';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  onRowClick?: (g: GroupListItem) => void;
}

export function GroupsTable({
  groups,
  isLoading,
  onToggleFavorite,
  onEdit,
  onDelete,
  onRowClick,
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">{t('favorite')}</TableHead>
          <TableHead className="bg-surface sticky left-10">{t('name')}</TableHead>
          <TableHead className="text-right">{t('walletCount')}</TableHead>
          <TableHead className="text-right">{t('accountValue')}</TableHead>
          <TableHead className="text-right">{t('unrealizedPnl')}</TableHead>
          <TableHead className="text-right">{t('roi')}</TableHead>
          <TableHead className="text-right">{t('volume')}</TableHead>
          <TableHead className="text-right">{t('openPositions')}</TableHead>
          <TableHead className="text-right">{t('winRate')}</TableHead>
          <TableHead className="text-right">{t('updated')}</TableHead>
          <TableHead className="text-right">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="text-muted-foreground text-center">
              {t('noGroups')}
            </TableCell>
          </TableRow>
        ) : (
          groups.map((row) => {
            const favorite = !!row.is_favorite;
            return (
              <TableRow
                key={row.id}
                className={cn('border-b', onRowClick && 'hover:bg-muted/40 cursor-pointer')}
                onClick={() => onRowClick?.(row)}
              >
                <TableCell className="p-2">
                  <button
                    type="button"
                    aria-label={t('favorite')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(row.id, !favorite);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Star className={cn('h-4 w-4', favorite && 'text-warning fill-current')} />
                  </button>
                </TableCell>
                <TableCell className="bg-surface sticky left-10" title={row.description ?? ''}>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-muted-foreground text-xs">{row.description ?? '—'}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.member_count}
                  <div className="text-muted-foreground text-xs">
                    {row.followed_count ?? 0} followed
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(row.account_value) ?? '—'}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium tabular-nums opacity-[0.88]',
                    (row.unrealized_pnl ?? 0) >= 0 ? 'text-financial-positive' : 'text-destructive',
                  )}
                >
                  {formatSignedUsd(row.unrealized_pnl)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatSignedPercent(row.roi != null ? row.roi * 100 : null) ?? '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(row.volume) ?? '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <a
                    href={`/groups/${row.id}?tab=positions`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    {row.open_positions}
                  </a>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(row.win_rate != null ? row.win_rate * 100 : null) ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs">
                  {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`${t('edit')} ${row.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(row);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t('delete')} ${row.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(row);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default GroupsTable;
