'use client';

import { cn } from 'cn';

export interface LongShortBarProps {
  longPct: number | null;
  shortPct: number | null;
  longLabel?: string;
  shortLabel?: string;
  className?: string;
}

export function LongShortBar({
  longPct,
  shortPct,
  longLabel,
  shortLabel,
  className,
}: LongShortBarProps) {
  const isNull = longPct === null || shortPct === null;
  const long = isNull ? 0 : (longPct ?? 0);
  let short = isNull ? 0 : (shortPct ?? 0);
  if (!isNull && long + short !== 100 && long + short > 0) {
    short = 100 - long;
  }
  const label = isNull ? '—' : `${long}% / ${short}%`;

  return (
    <div
      className={cn('flex flex-col gap-1', className)}
      role="img"
      aria-label={label}
      data-testid="long-short-bar"
    >
      <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary"
          style={{ width: `${long}%` }}
          aria-label={longLabel}
          aria-hidden="true"
        />
        <div
          className="bg-blue-500"
          style={{ width: `${short}%` }}
          aria-label={shortLabel}
          aria-hidden="true"
        />
      </div>
      {(longLabel || shortLabel) && (
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{longLabel}</span>
          <span>{shortLabel}</span>
        </div>
      )}
      <span className="text-muted-foreground text-xs" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

export default LongShortBar;
