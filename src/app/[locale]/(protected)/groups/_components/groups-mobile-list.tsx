'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Star, Pencil, Trash2 } from 'lucide-react';
import {
  formatPercent,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import type { GroupListItem } from '@/types/trader';

interface GroupsMobileListProps {
  groups: GroupListItem[];
  onRowClick?: (group: GroupListItem) => void;
  onEdit?: (group: GroupListItem) => void;
  onDelete?: (group: GroupListItem) => void;
  onToggleFavorite?: (id: string, next: boolean) => void;
}

export function GroupsMobileList({
  groups,
  onRowClick,
  onEdit,
  onDelete,
  onToggleFavorite,
}: GroupsMobileListProps) {
  const t = useTranslations('groups');
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <ul className="flex flex-col gap-2 lg:hidden">
      {groups.map((group) => {
        const favorite = !!group.is_favorite;
        const pnlTone =
          (group.unrealized_pnl ?? 0) >= 0 ? 'text-financial-positive' : 'text-destructive';
        return (
          <li key={group.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onRowClick?.(group)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick?.(group);
                }
              }}
              className="bg-surface border-border-subtle flex touch-manipulation flex-col gap-2 rounded-xl border p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={t('favorite')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(group.id, !favorite);
                      }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Star className={cn('h-4 w-4', favorite && 'text-warning fill-current')} />
                    </button>
                    <span className="truncate font-semibold">{group.name}</span>
                  </div>
                  {group.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                      {group.description}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('walletCount')}: {group.member_count}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      aria-label={`${t('edit')} ${group.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(group);
                      }}
                      className="text-muted-foreground hover:text-foreground p-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      aria-label={`${t('delete')} ${group.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(group);
                      }}
                      className="text-muted-foreground hover:text-destructive p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div>
                  <span className="text-muted-foreground block">{t('accountValue')}</span>
                  <span className="font-medium">{formatUsd(group.account_value) ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('unrealizedPnl')}</span>
                  <span className={cn('font-medium', pnlTone)}>
                    {formatSignedUsd(group.unrealized_pnl)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('roi')}</span>
                  <span className="font-medium">
                    {formatSignedPercent(group.roi != null ? group.roi * 100 : null) ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('winRate')}</span>
                  <span className="font-medium">
                    {formatPercent(group.win_rate != null ? group.win_rate * 100 : null) ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
