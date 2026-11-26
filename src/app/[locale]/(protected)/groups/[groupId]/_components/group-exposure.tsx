'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUsd } from '@/lib/trader-format';
import { getGroupExposure } from '@/services/traders';
import { LongShortBar } from '@/components/shared/traders/long-short-bar';
import type { GroupExposureResponse } from '@/types/trader';

export interface GroupExposureProps {
  groupId: string;
  period?: '1D' | '7D' | '30D' | '90D' | 'ALL';
  exposure?: GroupExposureResponse;
  isLoading?: boolean;
}

export function GroupExposure({
  groupId,
  period = '30D',
  exposure,
  isLoading,
}: GroupExposureProps) {
  const t = useTranslations('groups');
  const [data, setData] = useState<GroupExposureResponse | null>(exposure ?? null);
  const [loading, setLoading] = useState(isLoading ?? !exposure);

  useEffect(() => {
    if (exposure) {
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getGroupExposure(groupId, period);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [groupId, period, exposure]);

  if (loading) {
    return <Skeleton className="h-20 w-full" />;
  }
  if (!data || data.rows.length === 0) {
    return <div className="text-muted-foreground text-sm">{t('noOpenPositions')}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">{t('coin')}</th>
            <th className="p-2 text-right">{t('longExposure')}</th>
            <th className="p-2 text-right">{t('shortExposure')}</th>
            <th className="p-2 text-right">{t('netExposure')}</th>
            <th className="p-2 text-right">{t('grossNtl')}</th>
            <th className="p-2">{t('longShort')}</th>
            <th className="p-2 text-right">{t('walletCount')}</th>
            <th className="p-2 text-right">{t('avgLeverage')}</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const total = row.long_ntl + row.short_ntl;
            const longPct = total > 0 ? (row.long_ntl / total) * 100 : null;
            const shortPct = total > 0 ? (row.short_ntl / total) * 100 : null;
            return (
              <tr key={row.coin} className="border-b last:border-0">
                <td className="p-2 font-medium">{row.coin}</td>
                <td className="p-2 text-right tabular-nums">{formatUsd(row.long_ntl) ?? '—'}</td>
                <td className="p-2 text-right tabular-nums">{formatUsd(row.short_ntl) ?? '—'}</td>
                <td className="p-2 text-right tabular-nums">{formatUsd(row.net_ntl) ?? '—'}</td>
                <td className="p-2 text-right tabular-nums">{formatUsd(row.gross_ntl) ?? '—'}</td>
                <td className="p-2">
                  <LongShortBar longPct={longPct} shortPct={shortPct} />
                </td>
                <td className="p-2 text-right tabular-nums">
                  {row.long_wallets}/{row.short_wallets}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {row.avg_leverage != null ? row.avg_leverage.toFixed(2) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default GroupExposure;
