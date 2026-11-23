'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  pageSize?: number;
  total?: number;
  onPageSizeChange?: (size: number) => void;
  compact?: boolean;
}

type PageNumbersOption = boolean | { compact?: boolean };

export function getPageNumbers(
  current: number,
  total: number,
  compactOption?: PageNumbersOption,
): (number | '...')[] {
  const compact = typeof compactOption === 'boolean' ? compactOption : !!compactOption?.compact;

  if (compact) {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
  pageSize,
  onPageSizeChange,
  compact = false,
}: PaginationProps) {
  const t = useTranslations('traders');
  const tc = useTranslations('common');

  if (compact && totalPages <= 1) return null;
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const pages = getPageNumbers(currentPage, totalPages, compact);
  const safePageSize = pageSize ?? 20;

  return (
    <nav
      aria-label={tc('pagination')}
      className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && !compact && (
          <select
            aria-label={t('pageSize')}
            value={safePageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-wrap items-center gap-1">
          {!compact && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={disabled || currentPage <= 1}
              aria-label={tc('firstPage')}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || currentPage <= 1}
            aria-label={tc('previousPage')}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <div className="hidden items-center gap-1 sm:inline-flex">
            {pages.map((page, idx) =>
              page === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  aria-hidden="true"
                  className="text-muted-foreground px-1 text-sm"
                >
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-8 justify-center"
                  onClick={() => onPageChange(page)}
                  disabled={disabled}
                  aria-label={`${tc('page')} ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </Button>
              ),
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled || currentPage >= totalPages}
            aria-label={tc('nextPage')}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          {!compact && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={disabled || currentPage >= totalPages}
              aria-label={tc('lastPage')}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
