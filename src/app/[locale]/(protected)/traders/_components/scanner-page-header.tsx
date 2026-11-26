'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';

export interface ScannerPageHeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: Date | string | null;
  locale?: string;
  className?: string;
}

function formatTime(value: Date | string | null | undefined, locale: string): string {
  if (value === null || value === undefined) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(locale || 'en', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '—';
  }
}

export function ScannerPageHeader({
  title,
  subtitle,
  lastUpdated,
  locale,
  className,
}: ScannerPageHeaderProps) {
  const t = useTranslations('traders');
  const time = formatTime(lastUpdated ?? null, locale ?? 'en');

  return (
    <div className={cn('flex flex-col gap-1', className)} data-testid="scanner-page-header">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
      <p className="text-muted-foreground text-xs">{t('lastUpdated', { time: time ?? '—' })}</p>
    </div>
  );
}

export default ScannerPageHeader;
