'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInteger, formatSignedUsd, formatUsd } from '@/lib/trader-format';

export interface GroupsOverviewStatsProps {
  totalGroups: number;
  uniqueWallets: number;
  accountValue: number | null | undefined;
  unrealizedPnl: number | null | undefined;
  partial: boolean;
  isLoading?: boolean;
}

export function GroupsOverviewStats({
  totalGroups,
  uniqueWallets,
  accountValue,
  unrealizedPnl,
  partial,
  isLoading = false,
}: GroupsOverviewStatsProps) {
  const t = useTranslations();

  const pnlTone =
    unrealizedPnl === null || unrealizedPnl === undefined || unrealizedPnl === 0
      ? undefined
      : unrealizedPnl > 0
        ? 'text-primary'
        : 'text-destructive';

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      key: 'totalGroups',
      label: t('groups.totalGroups'),
      value: formatInteger(totalGroups) ?? '—',
    },
    {
      key: 'uniqueWallets',
      label: t('groups.totalUniqueWallets'),
      value: formatInteger(uniqueWallets) ?? '—',
    },
    {
      key: 'accountValue',
      label: t('groups.totalAccountValue'),
      value: formatUsd(accountValue) ?? '—',
    },
    {
      key: 'unrealizedPnl',
      label: t('groups.totalUnrealizedPnl'),
      value: formatSignedUsd(unrealizedPnl),
      className: cn('tabular-nums', pnlTone),
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-xs font-medium">{item.label}</dt>
            <dd className={cn('text-sm font-semibold tabular-nums', item.className)}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {partial && <span className="text-muted-foreground text-xs">{t('groups.partialData')}</span>}
    </div>
  );
}

export default GroupsOverviewStats;
