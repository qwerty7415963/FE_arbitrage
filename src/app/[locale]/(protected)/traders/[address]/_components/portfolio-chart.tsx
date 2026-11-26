'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSignedUsd, formatUsd } from '@/lib/trader-format';
import type {
  PortfolioMode,
  PortfolioRange,
  PortfolioRangeSeries,
  PortfolioSeriesPoint,
} from '@/types/trader';

const RANGES: PortfolioRange[] = ['24H', '7D', '30D', 'ALL'];

const MODES: PortfolioMode[] = ['perps', 'combined'];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;
const Y_TICKS = 5;
const X_TICKS = 5;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Metric = 'pnl' | 'value';

export interface PortfolioChartProps {
  series?: Partial<Record<PortfolioRange, PortfolioRangeSeries>>;
  mode: PortfolioMode;
  onModeChange: (mode: PortfolioMode) => void;
  isLoading?: boolean;
}

interface ChartPoint {
  time: string;
  value: number;
}

function parseTime(time: string): number {
  const parsed = Date.parse(time);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatAxisTime(time: string, range: PortfolioRange): string {
  const parsed = Date.parse(time);
  if (Number.isNaN(parsed)) return '';
  const date = new Date(parsed);
  if (range === '24H') {
    return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  }
  if (range === '7D') {
    return `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }
  return MONTHS[date.getUTCMonth()];
}

function selectPoints(
  rangeSeries: PortfolioRangeSeries | undefined,
  metric: Metric,
): PortfolioSeriesPoint[] {
  const points = metric === 'pnl' ? rangeSeries?.pnl : rangeSeries?.account_value;
  if (!points) return [];
  return points
    .filter((point) => Number.isFinite(point.value))
    .slice()
    .sort((a, b) => parseTime(a.time) - parseTime(b.time));
}

function computeDomain(points: ChartPoint[], metric: Metric): { min: number; max: number } {
  const values = points.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (metric === 'pnl') {
    min = Math.min(0, min);
    max = Math.max(0, max);
  } else {
    const span = max - min;
    const padding = span === 0 ? Math.max(Math.abs(max) * 0.05, 1) : span * 0.05;
    min -= padding;
    max += padding;
  }

  if (max === min) {
    max = min + 1;
  }
  return { min, max };
}

function tickIndexes(length: number, count: number): number[] {
  if (length === 0) return [];
  if (length <= count) return Array.from({ length }, (_, index) => index);
  return Array.from({ length: count }, (_, index) =>
    Math.round((index * (length - 1)) / (count - 1)),
  );
}

export function PortfolioChart({
  series,
  mode,
  onModeChange,
  isLoading = false,
}: PortfolioChartProps) {
  const t = useTranslations('traders');
  const [range, setRange] = useState<PortfolioRange>('ALL');
  const [metric, setMetric] = useState<Metric>('pnl');
  const [hovered, setHovered] = useState<number | null>(null);
  const clipId = `portfolio-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const points = selectPoints(series?.[range], metric);
  const hasPoints = points.length > 0;
  const domain = hasPoints ? computeDomain(points, metric) : null;
  const lastValue = hasPoints ? points[points.length - 1].value : null;
  const headline = metric === 'pnl' ? formatSignedUsd(lastValue) : (formatUsd(lastValue) ?? '—');
  const title = `${range} ${t(mode === 'perps' ? 'modePerps' : 'modeCombined')} ${t(
    metric === 'pnl' ? 'metricPnl' : 'metricValue',
  )}`;

  const yTicks = domain
    ? Array.from(
        { length: Y_TICKS },
        (_, index) => domain.max - ((domain.max - domain.min) * index) / (Y_TICKS - 1),
      )
    : [];

  let coordinates: Array<{ x: number; y: number }> = [];
  let linePath = '';
  let areaPath = '';
  let zeroY = 0;

  if (domain) {
    const { min, max } = domain;
    const span = max - min;
    coordinates = points.map((point, index) => ({
      x: points.length === 1 ? CHART_WIDTH / 2 : (index / (points.length - 1)) * CHART_WIDTH,
      y: CHART_HEIGHT - ((point.value - min) / span) * CHART_HEIGHT,
    }));
    linePath = coordinates
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    areaPath = `${linePath} L ${last.x} ${CHART_HEIGHT} L ${first.x} ${CHART_HEIGHT} Z`;
    zeroY = CHART_HEIGHT - ((0 - min) / span) * CHART_HEIGHT;
  }

  const xTickIndexes = tickIndexes(points.length, X_TICKS);

  return (
    <div className="bg-surface border-border-subtle flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="border-input bg-background inline-flex overflow-hidden rounded-lg border">
          {MODES.map((value) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onModeChange(value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold tracking-wide uppercase transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t(value === 'perps' ? 'modePerps' : 'modeCombined')}
              </button>
            );
          })}
        </div>

        <div className="border-input bg-background inline-flex overflow-hidden rounded-lg border">
          {(['pnl', 'value'] as Metric[]).map((value) => {
            const active = metric === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setMetric(value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold tracking-wide uppercase transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t(value === 'pnl' ? 'metricPnl' : 'metricValue')}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {title}
              </h3>
              <p className="text-2xl font-semibold tabular-nums">{headline}</p>
            </div>

            <div className="border-input bg-background inline-flex overflow-hidden rounded-lg border">
              {RANGES.map((value) => {
                const active = range === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRange(value)}
                    className={cn(
                      'px-2 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          {!hasPoints || !domain ? (
            <div className="text-muted-foreground flex h-44 items-center justify-center rounded-lg border border-dashed text-sm">
              {t('chartNoData')}
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="text-chart-axis flex h-44 w-16 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums">
                  {yTicks.map((value, index) => (
                    <span key={index}>{formatUsd(value) ?? '—'}</span>
                  ))}
                </div>

                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                  className="h-44 w-full"
                  role="img"
                  aria-label={title}
                  onMouseLeave={() => setHovered(null)}
                >
                  {' '}
                  {yTicks.map((value, index) => {
                    const y =
                      CHART_HEIGHT -
                      ((value - domain.min) / (domain.max - domain.min)) * CHART_HEIGHT;
                    return (
                      <line
                        key={index}
                        x1={0}
                        x2={CHART_WIDTH}
                        y1={y}
                        y2={y}
                        className="stroke-chart-grid"
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                  {metric === 'pnl' ? (
                    <>
                      <defs>
                        <clipPath id={`${clipId}-above`}>
                          <rect x={0} y={0} width={CHART_WIDTH} height={zeroY} />
                        </clipPath>
                        <clipPath id={`${clipId}-below`}>
                          <rect x={0} y={zeroY} width={CHART_WIDTH} height={CHART_HEIGHT - zeroY} />
                        </clipPath>
                      </defs>
                      <path
                        d={areaPath}
                        className="fill-financial-positive"
                        fillOpacity={0.18}
                        clipPath={`url(#${clipId}-above)`}
                      />
                      <path
                        d={areaPath}
                        className="fill-financial-negative"
                        fillOpacity={0.18}
                        clipPath={`url(#${clipId}-below)`}
                      />
                      <line
                        x1={0}
                        x2={CHART_WIDTH}
                        y1={zeroY}
                        y2={zeroY}
                        className="stroke-chart-crosshair"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d={linePath}
                        fill="none"
                        className="stroke-financial-positive"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        clipPath={`url(#${clipId}-above)`}
                      />
                      <path
                        d={linePath}
                        fill="none"
                        className="stroke-financial-negative"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        clipPath={`url(#${clipId}-below)`}
                      />
                    </>
                  ) : (
                    <>
                      <path d={areaPath} className="fill-chart-1" fillOpacity={0.15} />
                      <path
                        d={linePath}
                        fill="none"
                        className="stroke-chart-1"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  )}
                  {hasPoints && domain && hovered !== null && coordinates[hovered] ? (
                    <>
                      <line
                        x1={coordinates[hovered].x}
                        x2={coordinates[hovered].x}
                        y1={0}
                        y2={CHART_HEIGHT}
                        className="stroke-chart-crosshair"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                      />
                      {(() => {
                        const point = points[hovered];
                        const coord = coordinates[hovered];
                        const tooltipWidth = 120;
                        const tooltipHeight = 34;
                        const tooltipX = Math.max(
                          0,
                          Math.min(CHART_WIDTH - tooltipWidth - 4, coord.x + 8),
                        );
                        const tooltipY = Math.max(
                          0,
                          Math.min(CHART_HEIGHT - tooltipHeight - 4, coord.y - tooltipHeight - 8),
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
                              fontSize="10"
                              className="fill-chart-tooltip-text"
                            >
                              {new Date(parseTime(point.time)).toLocaleDateString()}
                            </text>
                            <text
                              x={tooltipX + 6}
                              y={tooltipY + 27}
                              fontSize="11"
                              className={
                                metric === 'pnl'
                                  ? point.value >= 0
                                    ? 'fill-financial-positive'
                                    : 'fill-financial-negative'
                                  : 'fill-chart-1'
                              }
                            >
                              {metric === 'pnl'
                                ? formatSignedUsd(point.value)
                                : (formatUsd(point.value) ?? '—')}
                            </text>
                          </g>
                        );
                      })()}
                    </>
                  ) : null}
                  {coordinates.map((coord, index) => (
                    <circle
                      key={`hover-${index}`}
                      cx={coord.x}
                      cy={coord.y}
                      r={8}
                      className="fill-transparent"
                      onMouseEnter={() => setHovered(index)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(index)}
                      onBlur={() => setHovered(null)}
                    />
                  ))}
                </svg>
              </div>

              <div className="flex gap-2">
                <div className="w-16 shrink-0" aria-hidden="true" />
                <div className="text-chart-axis flex w-full justify-between text-[11px] tabular-nums">
                  {xTickIndexes.map((index) => (
                    <span key={`${points[index].time}-${index}`}>
                      {formatAxisTime(points[index].time, range)}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
