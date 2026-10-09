import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PositionsSection } from '@/app/[locale]/(protected)/traders/[address]/_components/positions-section';
import type { PositionSnapshot } from '@/types/trader';
import enMessages from '@/messages/en.json';

const snapshot: PositionSnapshot = {
  summary: {
    account_value: 12345.6,
    total_ntl_pos: 5000,
    total_margin_used: 800,
    as_of: '2026-10-06T09:00:00Z',
  },
  positions: [
    {
      coin: 'BTC',
      side: 'LONG',
      size: 0.5,
      entry_price: 60000,
      mark_price: 63000,
      position_value: 31500,
      unrealized_pnl: 1500,
      return_on_equity: 0.05,
      liquidation_price: 55000,
      leverage: 3,
      max_leverage: 10,
      margin_used: 100,
      as_of: '2026-10-06T09:00:00Z',
    },
  ],
  data_status: 'ready',
  as_of: '2026-10-06T09:00:00Z',
};

function renderSection(props: Partial<React.ComponentProps<typeof PositionsSection>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <PositionsSection
        snapshot={snapshot}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('PositionsSection (contract v1.2)', () => {
  it('renders a position row with summary chips', () => {
    renderSection();
    expect(screen.getByText('Open Positions')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('LONG')).toBeInTheDocument();
    expect(screen.getByText('Account value')).toBeInTheDocument();
  });

  it('renders the empty state when there are no positions', () => {
    renderSection({ snapshot: { ...snapshot, positions: [] } });
    expect(screen.getByText('No open positions')).toBeInTheDocument();
  });

  it('shows Ready with as_of and never a syncing state', () => {
    renderSection();
    expect(screen.getByText(/Ready/)).toBeInTheDocument();
    expect(screen.queryByText(/Syncing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stale/)).not.toBeInTheDocument();
  });

  it('shows the error status for data_status error', () => {
    renderSection({ snapshot: { ...snapshot, data_status: 'error' } });
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it('calls onRetry when retry is clicked after an error', () => {
    const onRetry = vi.fn();
    renderSection({ snapshot: null, error: new Error('boom'), onRetry });
    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('exposes sortable headers with aria-sort and reports the picked column', () => {
    const onSortChange = vi.fn();
    renderSection({ sort: 'coin', dir: 'asc', onSortChange });
    const coinHeader = screen.getByRole('columnheader', { name: /Coin/ });
    expect(coinHeader).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(screen.getByRole('button', { name: /uPnL/ }));
    expect(onSortChange).toHaveBeenCalledWith('unrealized_pnl');
  });
});
