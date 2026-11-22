'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from 'cn';
import type {
  BucketDetail,
  BucketPositioningPoint,
  BucketRange,
  OverviewSentiment,
} from '@/types/trader';

export interface BucketPositioningChartProps {
  detail?: BucketDetail | null;
  positioning?: BucketPositioningPoint[] | null;
  series?: BucketPositioningPoint[] | null;
  data?: BucketPositioningPoint[] | null;
  bucket?: string;
  range?: BucketRange | string;
  selectedRange?: BucketRange | string;
  chartRange?: BucketRange | string;
  onRangeChange?: (range: string) => void;
  isLoading?: boolean;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 320;
const PAD_TOP = 12;
const PAD_RIGHT = 44;
const PAD_BOTTOM = 26;
const PAD_LEFT = 8;
const PLOT_WIDTH = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
const PLOT_BOTTOM = PAD_TOP + PLOT_HEIGHT;
const RANGES: BucketRange[] = ['24H', '7D', '30D'];
const SENTIMENTS: OverviewSentiment[] = [
  'very_bullish',
  'bullish',
  'slightly_bullish',
  'neutral',
  'slightly_bearish',
  'bearish',
  'very_bearish',
];
const TOOLTIP_WIDTH = 132;
const TOOLTIP_HEIGHT = 46;

interface ChartPoint {
  t: string;
  long_pct: number;
}

interface TooltipState {
  x: number;
  y: number;
  t: string;
  long: number;
  short: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateLabel(value: string, locale: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  const date = new Date(parsed);
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date);
  return `${month} ${date.getUTCDate()}`;
}

function tickIndexes(length: number, count: number): number[] {
  if (length === 0) return [];
  if (length <= count) return Array.from({ length }, (_, index) => index);
  return Array.from({ length: count }, (_, index) =>
    Math.round((index * (length - 1)) / (count - 1)),
  );
}

function humanizeBucket(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function BucketPositioningChart(props: BucketPositioningChartProps) {
  const t = useTranslations('traders.bucketDetail');
  const tOverview = useTranslations('traders.overview');
  const locale = useLocale();
  const positioning =
    props.positioning ?? props.series ?? props.data ?? props.detail?.positioning ?? [];
  const rawPoints: BucketPositioningPoint[] = Array.isArray(positioning) ? positioning : [];
  const allPoints: ChartPoint[] = rawPoints
    .map((point) => ({
      t: point?.t ?? '',
      long_pct: clamp01(typeof point?.long_pct === 'number' ? point.long_pct : 0.5),
    }))
    .sort((a, b) => parseTime(a.t) - parseTime(b.t));

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [chartRange, setChartRange] = useState<BucketRange>(
    (String(props.chartRange ?? props.selectedRange ?? props.range ?? '30D') as BucketRange) ||
      '30D',
  );

  const maxTime = allPoints.length ? Math.max(...allPoints.map((point) => parseTime(point.t))) : 0;
  let slicedPoints = allPoints;
  if (chartRange === '7D' && allPoints.length > 0) {
    const cutoff = maxTime - 6 * 86400000;
    const filtered = allPoints.filter((point) => parseTime(point.t) >= cutoff);
    slicedPoints = filtered.length > 0 ? filtered : allPoints.slice(-7);
  } else if (chartRange === '24H' && allPoints.length > 0) {
    const cutoff = maxTime - 86400000;
    const filtered = allPoints.filter((point) => parseTime(point.t) >= cutoff);
    slicedPoints = filtered.length >= 2 ? filtered : allPoints.slice(-2);
  }
  const points: ChartPoint[] = chartRange === '30D' ? allPoints : slicedPoints;

  const activeRange = chartRange;
  const sentiment = String(props.detail?.sentiment ?? 'neutral');
  const sentimentLabel = SENTIMENTS.includes(sentiment as OverviewSentiment)
    ? tOverview(('sentiment.' + sentiment) as never)
    : sentiment.replace(/_/g, ' '); // fallback: sentiment value not in known set, humanize snake_case
  const bucketName = humanizeBucket(props.bucket ?? props.detail?.bucket_id ?? '');
  const title = bucketName ? t('chart.positioningTitle', { bucket: bucketName }) : t('chart.title');

  const hasPoints = points.length > 0;
  const lastPoint = hasPoints ? points[points.length - 1] : null;
  const latestLong = lastPoint ? lastPoint.long_pct : null;
  const longTone =
    latestLong === null || latestLong === 0.5
      ? 'text-muted-foreground'
      : latestLong > 0.5
        ? 'text-emerald-500'
        : 'text-rose-500';

  const xAt = (index: number): number =>
    PAD_LEFT + (points.length === 1 ? PLOT_WIDTH / 2 : (index / (points.length - 1)) * PLOT_WIDTH);
  const yAt = (pct: number): number => PAD_TOP + (1 - pct) * PLOT_HEIGHT;

  const coordinates = points.map((point, index) => ({
    x: xAt(index),
    y: yAt(point.long_pct),
  }));
  const boundaryPath = coordinates
    .map((coordinate, index) => `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`)
    .join(' ');
  const firstCoordinate = coordinates[0];
  const lastCoordinate = coordinates[coordinates.length - 1];
  const longAreaPath =
    hasPoints && firstCoordinate && lastCoordinate
      ? `${boundaryPath} L ${lastCoordinate.x} ${PLOT_BOTTOM} L ${firstCoordinate.x} ${PLOT_BOTTOM} Z`
      : '';
  const shortAreaPath =
    hasPoints && firstCoordinate && lastCoordinate
      ? `${boundaryPath} L ${lastCoordinate.x} ${PAD_TOP} L ${firstCoordinate.x} ${PAD_TOP} Z`
      : '';

  const showTooltip = (index: number) => {
    const point = points[index];
    const coordinate = coordinates[index];
    if (!point || !coordinate) return;
    setTooltip({
      x: coordinate.x,
      y: coordinate.y,
      t: point.t,
      long: point.long_pct,
      short: 1 - point.long_pct,
    });
  };

  const tooltipX =
    tooltip === null ? 0 : Math.max(0, Math.min(CHART_WIDTH - TOOLTIP_WIDTH - 4, tooltip.x + 8));
  const tooltipY =
    tooltip === null
      ? 0
      : Math.max(0, Math.min(CHART_HEIGHT - TOOLTIP_HEIGHT - 4, tooltip.y - TOOLTIP_HEIGHT - 8));
  const xTickIndexes = tickIndexes(points.length, 5);

  return (
    <div
      data-testid="bucket-positioning-chart"
      className="bg-card flex h-full flex-col gap-2 rounded-xl border p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div
          className="border-input bg-background inline-flex overflow-hidden rounded-lg border"
          role="group"
          aria-label={t('range')}
        >
          {RANGES.map((value) => {
            const active = activeRange === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setChartRange(value)}
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

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span data-testid="chart-range-caption">
          {t('chart.rangeCaption', { range: activeRange, sentiment: sentimentLabel.toUpperCase() })}
        </span>
        {latestLong !== null ? (
          <span data-testid="chart-long-caption" className={cn('font-medium', longTone)}>
            {t('chart.percentLong', { value: (latestLong * 100).toFixed(1) })}
          </span>
        ) : null}
      </div>

      {!hasPoints ? (
        <div className="text-muted-foreground flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm">
          {t('chart.noData')}
        </div>
      ) : (
        <svg
          data-testid="positioning-chart-svg"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={title}
          onMouseLeave={() => setTooltip(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((value) => (
            <line
              key={value}
              x1={PAD_LEFT}
              x2={PAD_LEFT + PLOT_WIDTH}
              y1={yAt(value)}
              y2={yAt(value)}
              className="stroke-border/20"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path
            data-testid="positioning-long-area"
            d={longAreaPath}
            className="fill-emerald-500"
            fillOpacity={0.25}
          />
          <path
            data-testid="positioning-short-area"
            d={shortAreaPath}
            className="fill-rose-500"
            fillOpacity={0.25}
          />
          <path
            data-testid="positioning-long-line"
            d={boundaryPath}
            fill="none"
            className="stroke-emerald-500"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <path
            data-testid="positioning-short-line"
            d={boundaryPath}
            fill="none"
            className="stroke-rose-500"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
          />

          {coordinates.map((coordinate, index) => (
            <circle
              key={`${points[index].t}-${index}`}
              cx={coordinate.x}
              cy={coordinate.y}
              r={10}
              tabIndex={0}
              role="button"
              aria-label={`${formatDateLabel(points[index].t, locale)} ${(
                points[index].long_pct * 100
              ).toFixed(1)}%`}
              className="fill-transparent focus:outline-none"
              onMouseEnter={() => showTooltip(index)}
              onFocus={() => showTooltip(index)}
              onMouseLeave={() => setTooltip(null)}
              onBlur={() => setTooltip(null)}
            />
          ))}

          {[1, 0.75, 0.5, 0.25, 0].map((value) => (
            <text
              key={value}
              data-testid="y-axis-label"
              x={CHART_WIDTH - 4}
              y={yAt(value) + 3}
              textAnchor="end"
              fontSize="10"
              className="fill-muted-foreground"
            >
              {Math.round(value * 100)}%
            </text>
          ))}

          {xTickIndexes.map((pointIndex, position) => (
            <text
              key={`${points[pointIndex].t}-${position}`}
              data-testid="x-axis-label"
              x={coordinates[pointIndex].x}
              y={CHART_HEIGHT - 6}
              textAnchor={
                position === 0 ? 'start' : position === xTickIndexes.length - 1 ? 'end' : 'middle'
              }
              fontSize="10"
              className="fill-muted-foreground"
            >
              {formatDateLabel(points[pointIndex].t, locale)}
            </text>
          ))}

          {tooltip ? (
            <g data-testid="positioning-tooltip">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={TOOLTIP_WIDTH}
                height={TOOLTIP_HEIGHT}
                rx={4}
                className="fill-background stroke-border"
                strokeWidth={1}
              />
              <text
                x={tooltipX + 6}
                y={tooltipY + 14}
                fontSize="10"
                className="fill-foreground font-medium"
              >
                {formatDateLabel(tooltip.t, locale)}
              </text>
              <text x={tooltipX + 6} y={tooltipY + 28} fontSize="10" className="fill-emerald-500">
                {`${t('statBars.long')} ${(tooltip.long * 100).toFixed(1)}%`}
              </text>
              <text x={tooltipX + 6} y={tooltipY + 42} fontSize="10" className="fill-rose-500">
                {`${t('statBars.short')} ${(tooltip.short * 100).toFixed(1)}%`}
              </text>
            </g>
          ) : null}
        </svg>
      )}
    </div>
  );
}

export default BucketPositioningChart;
