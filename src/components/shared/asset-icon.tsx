'use client';

import { useState } from 'react';
import { ChartLine, CandlestickChart, Gem } from 'lucide-react';
import { stripDexPrefix } from '@/lib/asset-meta';
import { cn } from 'cn';

export interface AssetIconProps {
  symbol?: string;
  logoUrl?: string | null;
  category?: string;
  size?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
}

const LUCIDE_BY_CATEGORY: Record<string, typeof ChartLine> = {
  index: ChartLine,
  equity: CandlestickChart,
  commodity: Gem,
};

export function AssetIcon({
  symbol = '',
  logoUrl,
  category,
  size = 16,
  loading = 'lazy',
  className,
}: AssetIconProps) {
  const [failed, setFailed] = useState(false);
  const base = stripDexPrefix(symbol ?? '')
    .toUpperCase()
    .trim();
  const showLogo = !!logoUrl && !failed;

  if (showLogo) {
    return (
      <span
        className={cn(
          'bg-muted inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
          className,
        )}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl as string}
          width={size}
          height={size}
          alt={symbol || ''}
          loading={loading}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, objectFit: 'contain' }}
          className="block"
        />
      </span>
    );
  }

  const cat = (category ?? '').toLowerCase();
  const Icon = LUCIDE_BY_CATEGORY[cat];
  if (Icon) {
    return <Icon size={size} className={cn('inline-block shrink-0', className)} aria-hidden />;
  }

  const letters = base.slice(0, 2) || '?';
  if ((symbol ?? '').trim() === '' && !category) {
    return null;
  }
  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground inline-flex shrink-0 items-center justify-center rounded-full text-[9px] font-semibold uppercase',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {letters}
    </span>
  );
}
