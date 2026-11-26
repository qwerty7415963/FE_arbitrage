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

const W = 600;
const H = 180;

export interface GroupPerformanceChartProps {
  groupId: string;
  period?: '1D' | '7D' | '30D' | '90D' | 'ALL';
}

export function GroupPerformanceChart({ groupId, period }: GroupPerformanceChartProps) {
  const t = useTranslations('groups');
  const range: Range = (period as Range) ?? '30D';
  const [metric, setMetric] = useState<Metric>('pnl');
  const [hovered, setHovered] = useState<number | null>(null);
  const [data, setData] = useState<GroupPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getGroupPerformance(groupId, range)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          if (!res.metric_availability?.cumulative_realized_pnl) {
            setMetric('roi');
          }
        }
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

  const rawPoints = useMemo(() => {
    const rows = (data?.points ?? []).map((p) => ({
      t: Date.parse(p.t),
      v: metric === 'pnl' ? p.cumulative_realized_pnl : p.roi_index,
    }));
    rows.sort((a, b) => a.t - b.t);
    return rows;
  }, [data, metric]);

  const finitePoints = useMemo(
    () =>
      rawPoints.filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v)) as {
        t: number;
        v: number;
      }[],
    [rawPoints],
  );

  const hasPoints = finitePoints.length > 0;
  const firstPointTime = hasPoints ? finitePoints[0].t : null;
  const requestedFromTime = data?.from ? Date.parse(data.from) : NaN;
  const showStartsAt =
    firstPointTime != null &&
    Number.isFinite(requestedFromTime) &&
    firstPointTime > requestedFromTime;
  const values = finitePoints.map((p) => p.v);
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

  const tMin = hasPoints ? finitePoints[0].t : 0;
  const tMax = hasPoints ? finitePoints[finitePoints.length - 1].t : 1;
  const xOf = (t: number) => (tMax === tMin ? W / 2 : ((t - tMin) / (tMax - tMin)) * W);
  const y = (v: number) => H - ((v - min) / (max - min)) * H;

  let path = '';
  let prevFinite = false;
  for (const p of rawPoints) {
    if (typeof p.v !== 'number' || !Number.isFinite(p.v)) {
      prevFinite = false;
      continue;
    }
    const v = p.v;
    const cmd = prevFinite ? 'L' : 'M';
    path += `${cmd}${xOf(p.t).toFixed(1)},${y(v).toFixed(1)} `;
    prevFinite = true;
  }
  const last = hasPoints ? finitePoints[finitePoints.length - 1].v : null;
  const points = finitePoints;

  return (
    <div className="bg-surface border-border-subtle flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">{range}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!data?.metric_availability?.cumulative_realized_pnl}
            onClick={() => setMetric('pnl')}
            className={cn(
              'rounded-md px-2 py-1 text-xs',
              metric === 'pnl' ? 'bg-muted font-medium' : 'text-muted-foreground',
              !data?.metric_availability?.cumulative_realized_pnl &&
                'cursor-not-allowed opacity-40',
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
          {showStartsAt && firstPointTime
            ? ` (${t('chartStartsAt')} ${new Date(firstPointTime).toLocaleDateString()})`
            : data?.insufficient_data && data.from
              ? ` (${t('chartStartsAt')} ${new Date(data.from).toLocaleDateString()})`
              : ''}
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-lg font-semibold tabular-nums',
                (last ?? 0) >= 0 ? 'text-financial-positive' : 'text-financial-negative',
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
            onMouseLeave={() => setHovered(null)}
          >
            {' '}
            <line
              x1={0}
              y1={y(0)}
              x2={W}
              y2={y(0)}
              className="stroke-chart-crosshair"
              strokeWidth={1}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              fill="none"
              className={
                metric === 'pnl'
                  ? (last ?? 0) >= 0
                    ? 'stroke-financial-positive'
                    : 'stroke-financial-negative'
                  : 'stroke-chart-1'
              }
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            {hovered !== null && points[hovered] ? (
              <>
                <line
                  x1={xOf(points[hovered].t)}
                  x2={xOf(points[hovered].t)}
                  y1={0}
                  y2={H}
                  className="stroke-chart-crosshair"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                {(() => {
                  const point = points[hovered];
                  const cx = xOf(point.t);
                  const cy = y(point.v);
                  const tooltipWidth = 120;
                  const tooltipHeight = 34;
                  const tooltipX = Math.max(0, Math.min(W - tooltipWidth - 4, cx + 8));
                  const tooltipY = Math.max(
                    0,
                    Math.min(H - tooltipHeight - 4, cy - tooltipHeight - 8),
                  );
                  return (
                    <g>
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx={4}
                        className="fill-chart-tooltip-bg stroke-chart-tooltip-border"
                        strokeWidth={1}
                      />
                      <text
                        x={tooltipX + 6}
                        y={tooltipY + 13}
                        fontSize="11"
                        className="fill-chart-tooltip-text"
                      >
                        {new Date(point.t).toLocaleString()}
                      </text>
                      <text
                        x={tooltipX + 6}
                        y={tooltipY + 27}
                        fontSize="11"
                        className={
                          metric === 'pnl'
                            ? point.v >= 0
                              ? 'fill-financial-positive'
                              : 'fill-financial-negative'
                            : 'fill-chart-1'
                        }
                      >
                        {metric === 'pnl' ? formatSignedUsd(point.v) : point.v.toFixed(2)}
                      </text>
                    </g>
                  );
                })()}
              </>
            ) : null}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={xOf(point.t)}
                cy={y(point.v)}
                r={6}
                className="fill-transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
              />
            ))}
          </svg>
          {showStartsAt && firstPointTime ? (
            <div className="text-chart-axis text-[11px]">
              {t('chartStartsAt')} {new Date(firstPointTime).toLocaleDateString()}
            </div>
          ) : null}
          <div className="text-chart-axis flex justify-between text-[11px]">
            <span>{firstPointTime ? new Date(firstPointTime).toLocaleString() : ''}</span>
            <span>
              {finitePoints.length
                ? new Date(finitePoints[finitePoints.length - 1].t).toLocaleString()
                : ''}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupPerformanceChart;
