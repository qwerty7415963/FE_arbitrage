import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ScannerToolbar } from '@/app/[locale]/(protected)/traders/_components/scanner-toolbar';
import enMessages from '@/messages/en.json';
import { TRADER_PERIODS } from '@/types/trader';

function renderToolbar(props: Partial<React.ComponentProps<typeof ScannerToolbar>> = {}) {
  const defaultProps: React.ComponentProps<typeof ScannerToolbar> = {
    period: '30D',
    onPeriodChange: vi.fn(),
    venue: 'hyperliquid',
    venues: ['hyperliquid', 'binance'],
    onVenueChange: vi.fn(),
    filtersOpen: false,
    onToggleFilters: vi.fn(),
    filtersCount: 0,
    disabled: false,
    onSaveFilter: vi.fn(),
    resultText: null,
  };
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScannerToolbar {...defaultProps} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('ScannerToolbar', () => {
  it('renders period buttons and marks active state', () => {
    renderToolbar({ period: '7D' });
    for (const p of TRADER_PERIODS) {
      expect(screen.getByRole('button', { name: p })).toBeInTheDocument();
    }
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

  it('calls onPeriodChange', async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    renderToolbar({ onPeriodChange });
    await user.click(screen.getByRole('button', { name: '7D' }));
    expect(onPeriodChange).toHaveBeenCalledWith('7D');
  });

  it('lists venues in dropdown and calls onVenueChange', async () => {
    const user = userEvent.setup();
    const onVenueChange = vi.fn();
    renderToolbar({ onVenueChange });
    await user.click(screen.getByRole('button', { name: 'Venue' }));
    const binance = await screen.findByRole('menuitem', { name: 'binance' });
    await user.click(binance);
    expect(onVenueChange).toHaveBeenCalledWith('binance');
  });

  it('calls onToggleFilters and shows count', async () => {
    const user = userEvent.setup();
    const onToggleFilters = vi.fn();
    renderToolbar({ filtersCount: 3, onToggleFilters });
    const btn = screen.getByRole('button', { name: 'Filters (3)' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('3')).toBeInTheDocument();
    await user.click(btn);
    expect(onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it('opens save dialog, submits name, disables when empty', async () => {
    const user = userEvent.setup();
    const onSaveFilter = vi.fn();
    renderToolbar({ onSaveFilter });
    await user.click(screen.getByRole('button', { name: 'Save Filter' }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByRole('textbox');
    const saveBtn = within(dialog).getByRole('button', { name: 'Save' });
    expect(saveBtn).toBeDisabled();
    await user.type(input, 'My filter');
    expect(saveBtn).not.toBeDisabled();
    await user.click(saveBtn);
    expect(onSaveFilter).toHaveBeenCalledWith('My filter');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables controls when disabled', () => {
    renderToolbar({ disabled: true });
    for (const p of TRADER_PERIODS) {
      expect(screen.getByRole('button', { name: p })).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Venue' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save Filter' })).toBeDisabled();
  });
});
