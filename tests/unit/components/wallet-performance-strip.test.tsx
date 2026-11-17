import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { WalletPerformanceStrip } from '@/app/[locale]/(protected)/traders/[address]/_components/wallet-performance-strip';
import type { PeriodMetrics } from '@/types/trader';
import enMessages from '@/messages/en.json';

const metrics: PeriodMetrics = {
  wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  venue: 'hyperliquid',
  venue_id: null,
  period: '30D',
  display_name: 'Smart Money',
  pnl: 5000,
  realized_pnl: 5000,
  roi: 25,
  win_rate: 70,
  volume: 100000,
  trade_count: 50,
  profit_factor: 2.1,
  max_drawdown_pct: 3.5,
  long_count: 30,
  long_wins: 24,
  short_count: 20,
  short_wins: 10,
  gross_profit: null,
  gross_loss: null,
  avg_trade_pnl: null,
  avg_holding_time_sec: null,
  last_trade_at: '2024-01-02T00:00:00Z',
  data_status: 'ready',
  is_partial: false,
  metrics_as_of: '2024-01-02T01:00:00Z',
  calculation_version: 1,
};

function renderStrip(props: Partial<React.ComponentProps<typeof WalletPerformanceStrip>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <WalletPerformanceStrip period="30D" onPeriodChange={vi.fn()} metrics={metrics} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('WalletPerformanceStrip', () => {
  it('renders the period group with the active period pressed', () => {
    renderStrip();
    const group = screen.getByRole('group', { name: 'Period' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30D' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onPeriodChange when another period is clicked', () => {
    const onPeriodChange = vi.fn();
    renderStrip({ onPeriodChange });
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    expect(onPeriodChange).toHaveBeenCalledWith('7D');
  });

  it('renders the six inline metrics', () => {
    renderStrip();
    expect(screen.getByText('+25.00%')).toBeInTheDocument();
    expect(screen.getByText('70.00%')).toBeInTheDocument();
    expect(screen.getByText('$100.00K')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('2.10')).toBeInTheDocument();
    expect(screen.getByText('3.50')).toBeInTheDocument();
  });

  it('renders a dash for every metric when metrics are null', () => {
    renderStrip({ metrics: null });
    expect(screen.getAllByText('—')).toHaveLength(6);
  });
});
