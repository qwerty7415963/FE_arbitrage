'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { OverviewPoint } from '@/types/trader';

export interface OverviewSparklineProps {
  series?: OverviewPoint[] | null;
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

export function OverviewSparkline({
  series,
  width = 120,
  height = 32,
  className,
  color = 'currentColor',
}: OverviewSparklineProps) {
  const t = useTranslations('traders');
  const points = useMemo(() => {
    if (!series || series.length === 0) return '';
    const values = series.map((p) => p.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return series
      .map((p, i) => {
        const x = (i / Math.max(series.length - 1, 1)) * width;
        const y = height - ((p.v - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [series, width, height]);

  if (!series || series.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        role="img"
        aria-label={t('sparklineEmpty')}
        data-testid="overview-sparkline"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={t('sparkline')}
      data-testid="overview-sparkline"
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export const Sparkline = OverviewSparkline;
