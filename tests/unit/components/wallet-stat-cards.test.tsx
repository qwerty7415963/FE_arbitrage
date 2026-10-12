import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { WalletStatCards } from '@/app/[locale]/(protected)/traders/[address]/_components/wallet-stat-cards';
import type { OpenPosition, PeriodMetrics, PositionSummary } from '@/types/trader';
import enMessages from '@/messages/en.json';

const summary: PositionSummary = {
  account_value: 12345.6,
  total_ntl_pos: 5000,
  total_margin_used: 800,
  as_of: '2026-10-06T09:00:00Z',
};

function position(coin: string, unrealized_pnl: number | null): OpenPosition {
  return {
    coin,
    side: 'LONG',
    size: 0.5,
    entry_price: 60000,
    mark_price: 63000,
    position_value: 31500,
    unrealized_pnl,
    return_on_equity: 0.05,
    liquidation_price: 55000,
    leverage: 3,
    max_leverage: 10,
    margin_used: 100,
    as_of: '2026-10-06T09:00:00Z',
  };
}

const metrics = {
  roi: 25,
  win_rate: 70,
  volume: 100000,
  trade_count: 50,
  profit_factor: 2.1,
  max_drawdown_pct: null,
} as unknown as PeriodMetrics;

function renderCards(props: Partial<React.ComponentProps<typeof WalletStatCards>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <WalletStatCards
        summary={summary}
        positions={[position('BTC', 1500), position('ETH', -200)]}
        metrics={metrics}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('WalletStatCards (reskin)', () => {
  it('renders account row with derived available margin and summed unrealized', () => {
    renderCards();
    expect(screen.getByText('Account value')).toBeInTheDocument();
    expect(screen.getByText('$12.35K')).toBeInTheDocument();
    expect(screen.getByText('Available margin')).toBeInTheDocument();
    expect(screen.getByText('$11.55K')).toBeInTheDocument();
    expect(screen.getByText('uPnL')).toBeInTheDocument();
    expect(screen.getByText('+$1,300')).toBeInTheDocument();
  });

  it('renders metrics row without invented deltas or sparklines', () => {
    renderCards();
    expect(screen.getByText('+25.00%')).toBeInTheDocument();
    expect(screen.getByText('70.00%')).toBeInTheDocument();
    expect(screen.getByText('$100.00K')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('2.10')).toBeInTheDocument();
  });

  it('shows dashes when summary, positions and metrics are null', () => {
    renderCards({ summary: null, positions: [], metrics: null });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows a loading skeleton', () => {
    renderCards({ isLoading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error with retry', () => {
    const onRetry = vi.fn();
    renderCards({
      summary: null,
      positions: [],
      metrics: null,
      error: new Error('boom'),
      onRetry,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
