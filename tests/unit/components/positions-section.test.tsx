import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PositionsSection } from '@/app/[locale]/(protected)/traders/[address]/_components/positions-section';
import type { OpenPosition, PositionSnapshot } from '@/types/trader';
import enMessages from '@/messages/en.json';

function position(overrides: Partial<OpenPosition> = {}): OpenPosition {
  return {
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
    ...overrides,
  };
}

const snapshot: PositionSnapshot = {
  summary: {
    account_value: 12345.6,
    total_ntl_pos: 5000,
    total_margin_used: 800,
    as_of: '2026-10-06T09:00:00Z',
  },
  positions: [
    position({ coin: 'BTC', side: 'LONG', leverage: 3 }),
    position({ coin: 'ETH', side: 'SHORT', leverage: 1, unrealized_pnl: -200 }),
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
  it('renders a position row with the context line', () => {
    const { container } = renderSection();
    expect(screen.getByText('Open Positions')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('LONG')).toBeInTheDocument();
    expect(container.querySelector('p')).toHaveTextContent(
      '2 positions · 50% long · 2× position lev',
    );
  });

  it('does not repeat account value, notional or margin inside positions', () => {
    renderSection();
    expect(screen.queryByText('Account value')).not.toBeInTheDocument();
    expect(screen.queryByText('Total notional')).not.toBeInTheDocument();
    expect(screen.queryByText('Total margin')).not.toBeInTheDocument();
  });

  it('renders the empty state when there are no positions', () => {
    renderSection({ snapshot: { ...snapshot, positions: [] } });
    expect(screen.getByText('No open positions')).toBeInTheDocument();
  });

  it('falls back to count-based long % when position values are missing', () => {
    const { container } = renderSection({
      snapshot: {
        ...snapshot,
        positions: [
          position({ coin: 'BTC', side: 'LONG', position_value: null }),
          position({ coin: 'ETH', side: 'SHORT', position_value: null, leverage: 1 }),
        ],
      },
    });
    expect(container.querySelector('p')).toHaveTextContent(
      '2 positions · 50% long · 2× position lev',
    );
  });

  it('shows only an inline error status for data_status error', () => {
    renderSection({ snapshot: { ...snapshot, data_status: 'error' } });
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('never renders the old ready/as-of status line', () => {
    renderSection();
    expect(screen.queryByText(/Ready/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Syncing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stale/)).not.toBeInTheDocument();
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

  it('renders TP and SL column headers', () => {
    renderSection();
    expect(screen.getByRole('columnheader', { name: 'TP' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'SL' })).toBeInTheDocument();
  });

  it('renders TP/SL values with overflow and title', () => {
    renderSection({
      snapshot: {
        ...snapshot,
        positions: [position({ tp_pxs: [123.4, 130, 140], sl_pxs: [100, 90] })],
      },
    });
    const tpCell = screen.getByTitle('$123.40, $130.00, $140.00');
    expect(tpCell).toHaveTextContent('$123.40 · $130.00 +1');
    const slCell = screen.getByTitle('$100.00, $90.00');
    expect(slCell).toHaveTextContent('$100.00 · $90.00');
  });

  it('renders dash when TP/SL empty', () => {
    renderSection({
      snapshot: {
        ...snapshot,
        positions: [position({ tp_pxs: [], sl_pxs: null as unknown as undefined })],
      },
    });
    // two dash cells for tp/sl
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
