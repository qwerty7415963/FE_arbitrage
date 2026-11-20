import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ScannerCommandBar } from '@/app/[locale]/(protected)/traders/_components/scanner-command-bar';
import enMessages from '@/messages/en.json';

function renderBar(props: Partial<React.ComponentProps<typeof ScannerCommandBar>> = {}) {
  const defaultProps: React.ComponentProps<typeof ScannerCommandBar> = {
    title: 'Trader Scanner',
    resultText: null,
    refresh: vi.fn(),
    filtersOpen: false,
    onToggleFilters: vi.fn(),
    disabled: false,
    period: '30D',
    onPeriodChange: vi.fn(),
    venue: 'hyperliquid',
    filtersCount: 0,
    savedViews: [],
  };
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScannerCommandBar {...defaultProps} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('ScannerCommandBar', () => {
  it('renders title and result text with aria-live', () => {
    renderBar({ resultText: 'Page 1 of 1 · 1 results' });
    expect(screen.getByRole('heading', { name: 'Trader Scanner' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1 · 1 results')).toHaveAttribute('aria-live', 'polite');
  });

  it('shows filters badge count', () => {
    renderBar({ filtersCount: 3 });
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('opens saved views dropdown', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderBar({ savedViews: [{ name: 'My view', onApply }] });
    await user.click(screen.getByRole('button', { name: 'Saved views' }));
    await user.click(await screen.findByRole('menuitem', { name: 'My view' }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('calls refresh', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    renderBar({ refresh });
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
