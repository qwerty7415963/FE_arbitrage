import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ScannerHeader } from '@/app/[locale]/(protected)/traders/_components/scanner-header';
import enMessages from '@/messages/en.json';

function renderHeader(props: Partial<React.ComponentProps<typeof ScannerHeader>> = {}) {
  const defaultProps: React.ComponentProps<typeof ScannerHeader> = {
    period: '30D',
    onPeriodChange: vi.fn(),
    venue: 'hyperliquid',
    groups: [],
    groupId: '',
    onGroupChange: vi.fn(),
    resultText: null,
    filtersOpen: true,
    onToggleFilters: vi.fn(),
    sortBy: 'pnl',
    sortDirection: 'desc',
    onSortSelect: vi.fn(),
  };
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScannerHeader {...defaultProps} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('ScannerHeader', () => {
  it('marks the active period as pressed', () => {
    renderHeader({ period: '7D' });
    const group = screen.getByRole('group', { name: 'Period' });
    expect(within(group).getByRole('button', { name: '7D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(group).getByRole('button', { name: '30D' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('notifies period changes', async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderHeader({ onPeriodChange });
    await user.click(screen.getByRole('button', { name: '7D' }));
    expect(onPeriodChange).toHaveBeenCalledWith('7D');
  });

  it('renders the venue as static text, not a control', () => {
    renderHeader();
    expect(screen.getByText('hyperliquid')).toBeInTheDocument();
    expect(screen.queryByLabelText('Venue')).not.toBeInTheDocument();
  });

  it('renders group options when loaded', () => {
    renderHeader({
      groups: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 3 }],
    });
    expect(screen.getByRole('option', { name: 'Main' })).toBeInTheDocument();
  });

  it('shows an auth hint and disables the group select when groups are unavailable', () => {
    renderHeader({ groups: null });
    expect(screen.getByLabelText('Group')).toBeDisabled();
    expect(screen.getByText('Connect a wallet to filter by group')).toBeInTheDocument();
  });

  it('notifies group changes', async () => {
    const user = userEvent.setup();
    const onGroupChange = vi.fn();
    renderHeader({
      groups: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 3 }],
      onGroupChange,
    });
    await user.selectOptions(screen.getByLabelText('Group'), 'g1');
    expect(onGroupChange).toHaveBeenCalledWith('g1');
  });

  it('toggles the metric filters with an expanded state', async () => {
    const user = userEvent.setup();
    const onToggleFilters = vi.fn();
    renderHeader({ filtersOpen: false, onToggleFilters });
    const toggle = screen.getByRole('button', { name: 'Filters' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'scanner-metric-filters');
    await user.click(toggle);
    expect(onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it('notifies sort selection with column and direction', async () => {
    const user = userEvent.setup();
    const onSortSelect = vi.fn();
    renderHeader({ onSortSelect });
    await user.selectOptions(screen.getByLabelText('Sort'), 'roi:asc');
    expect(onSortSelect).toHaveBeenCalledWith('roi', 'asc');
  });

  it('shows the result count when provided', () => {
    renderHeader({ resultText: '20 shown, more available' });
    expect(screen.getByText('20 shown, more available')).toBeInTheDocument();
  });
});
