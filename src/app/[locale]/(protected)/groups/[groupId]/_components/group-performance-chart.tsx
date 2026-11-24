'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSignedUsd } from '@/lib/trader-format';
import { getGroupPerformance } from '@/services/traders';
import type { GroupPerformanceResponse } from '@/types/trader';
import { cn } from 'cn';

type Range = '1D' | '7D' | '30D' | '90D' | 'ALL';
type Metric = 'pnl' | 'roi';

const RANGES: Range[] = ['1D', '7D', '30D', '90D', 'ALL'];
const W = 600;
const H = 180;

export interface GroupPerformanceChartProps {
  groupId: string;
}

export function GroupPerformanceChart({ groupId }: GroupPerformanceChartProps) {
  const t = useTranslations('groups');
  const [range, setRange] = useState<Range>('30D');
  const [metric, setMetric] = useState<Metric>('pnl');
  const [data, setData] = useState<GroupPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getGroupPerformance(groupId, range)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, range]);

  const points = useMemo(() => {
    const rows = (data?.points ?? [])
      .map((p) => ({
        t: Date.parse(p.t),
        v: metric === 'pnl' ? p.cumulative_realized_pnl : p.roi_index,
      }))
      .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.t)) as { t: number; v: number }[];
    rows.sort((a, b) => a.t - b.t);
    return rows;
  }, [data, metric]);

  const hasPoints = points.length > 0;
  const values = points.map((p) => p.v);
  let min = hasPoints ? Math.min(...values) : 0;
  let max = hasPoints ? Math.max(...values) : 1;
  if (metric === 'pnl') {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (max === min) max = min + 1;
  const pad = (max - min) * 0.05;
  min -= pad;
  max += pad;

  const x = (i: number) => (points.length <= 1 ? 0 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(' ');
  const last = points.length > 0 ? points[points.length - 1].v : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setLoading(true);
                setRange(r);
              }}
              className={cn(
                'rounded-md px-2 py-1 text-xs',
                range === r
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r === 'ALL' ? t('rangeAll') : r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMetric('pnl')}
            className={cn(
              'rounded-md px-2 py-1 text-xs',
              metric === 'pnl' ? 'bg-muted font-medium' : 'text-muted-foreground',
            )}
          >
            {t('chartCumulativePnl')}
          </button>
          <button
            type="button"
            onClick={() => setMetric('roi')}
            className={cn(
              'rounded-md px-2 py-1 text-xs',
              metric === 'roi' ? 'bg-muted font-medium' : 'text-muted-foreground',
            )}
          >
            {t('chartRoi')}
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[180px] w-full" />
      ) : !hasPoints ? (
        <div className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
          {t('insufficientData')}
          {data?.insufficient_data && data.from ? ` (${t('chartStartsAt')} ${data.from})` : ''}
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-lg font-semibold tabular-nums',
                (last ?? 0) >= 0 ? 'text-emerald-400' : 'text-destructive',
              )}
            >
              {metric === 'pnl' ? formatSignedUsd(last) : `${(last ?? 0).toFixed(2)}`}
            </span>
            <span className="text-muted-foreground text-xs">
              {data?.granularity === 'intraday' ? '1D' : range}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[180px] w-full"
            role="img"
            aria-label={t('chartTitle')}
          >
            <line x1={0} y1={y(0)} x2={W} y2={y(0)} className="stroke-border" strokeWidth={1} />
            <path
              d={path}
              fill="none"
              className="stroke-primary"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="text-muted-foreground flex justify-between text-[10px]">
            <span>{data?.from}</span>
            <span>{data?.to}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupPerformanceChart;
