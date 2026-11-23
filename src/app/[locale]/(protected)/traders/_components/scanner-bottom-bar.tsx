'use client';

import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import { Pagination } from '@/components/shared/pagination';
import type { PaginationProps } from '@/components/shared/pagination';

export interface ScannerBottomBarProps extends Partial<PaginationProps> {
  start: number;
  end: number;
  total: number;
  children?: React.ReactNode;
  className?: string;
}

export function ScannerBottomBar({
  start,
  end,
  total,
  children,
  className,
  currentPage,
  totalPages,
  onPageChange,
  disabled,
  pageSize,
  onPageSizeChange,
  compact,
}: ScannerBottomBarProps) {
  const locale = useLocale();
  const t = useTranslations('traders');
  const formattedStart = new Intl.NumberFormat(locale).format(start);
  const formattedEnd = new Intl.NumberFormat(locale).format(end);
  const formattedTotal = new Intl.NumberFormat(locale).format(total);

  const showPagination =
    children == null &&
    currentPage !== undefined &&
    totalPages !== undefined &&
    onPageChange !== undefined;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      data-testid="scanner-bottom-bar"
    >
      <div className="text-muted-foreground text-sm">
        {total === 0
          ? t('noResults')
          : t('showingResults', {
              start: formattedStart,
              end: formattedEnd,
              total: formattedTotal,
            })}
      </div>
      <div className="flex items-center gap-2">
        {children != null ? children : null}
        {showPagination && (
          <Pagination
            currentPage={currentPage!}
            totalPages={totalPages!}
            onPageChange={onPageChange!}
            disabled={disabled}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}

export default ScannerBottomBar;
