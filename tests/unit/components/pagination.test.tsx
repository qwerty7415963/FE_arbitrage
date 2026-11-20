import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { Pagination, type PaginationProps } from '@/components/shared/pagination';
import enMessages from '@/messages/en.json';

function withIntl(ui: ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function renderPagination(props: PaginationProps) {
  return render(withIntl(<Pagination {...props} />));
}

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = renderPagination({
      currentPage: 1,
      totalPages: 1,
      onPageChange: () => {},
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders page numbers with aria-current on the active page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 2, totalPages: 3, onPageChange });
    const active = screen.getByRole('button', { name: 'Page 2' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute('aria-current');
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('collapses long ranges with ellipsis', () => {
    renderPagination({ currentPage: 5, totalPages: 10, onPageChange: () => {} });
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toHaveAttribute('aria-current', 'page');
  });

  it('disables prev on the first page and next on the last page', () => {
    const { rerender } = renderPagination({
      currentPage: 1,
      totalPages: 4,
      onPageChange: () => {},
    });
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
    rerender(withIntl(<Pagination currentPage={4} totalPages={4} onPageChange={() => {}} />));
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).not.toBeDisabled();
  });

  it('disables every button while loading', () => {
    renderPagination({ currentPage: 2, totalPages: 4, onPageChange: () => {}, disabled: true });
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });

  it('uses a labelled page size select and reports changes', async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    renderPagination({
      currentPage: 1,
      totalPages: 527,
      total: 10539,
      pageSize: 20,
      onPageChange: () => {},
      onPageSizeChange,
    });

    const select = screen.getByRole('combobox', { name: 'Page size' });
    await user.selectOptions(select, '50');
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
