import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { WalletIdentityCard } from '@/app/[locale]/(protected)/traders/[address]/_components/wallet-identity-card';
import type { PeriodMetrics, RegistryEntry } from '@/types/trader';
import enMessages from '@/messages/en.json';

const registry: RegistryEntry = {
  wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  venue: 'hyperliquid',
  venue_id: null,
  display_name: 'Smart Money',
  discovery_source: 'leaderboard',
  first_seen_at: '2024-01-01T00:00:00Z',
  last_seen_at: '2024-01-02T00:00:00Z',
  last_trade_at: '2024-01-02T00:00:00Z',
  leaderboard_seen_at: null,
  status: 'active',
};

const baseMetrics: PeriodMetrics = {
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
  max_drawdown_pct: null,
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

function renderCard(props: Partial<React.ComponentProps<typeof WalletIdentityCard>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <WalletIdentityCard
        registry={registry}
        lastUpdated="2024-01-02T01:00:00Z"
        onAdd={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('WalletIdentityCard (reskin)', () => {
  it('renders avatar initial, full address, venue and leaderboard badges', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Smart Money' })).toBeInTheDocument();
    expect(screen.getByText('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBeInTheDocument();
    expect(screen.getByText('hyperliquid')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('First seen')).toBeInTheDocument();
    expect(screen.getByText('Last seen')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('opens the add-to-group modal from the overflow button', () => {
    const onAdd = vi.fn();
    renderCard({ onAdd });
    fireEvent.click(screen.getByRole('button', { name: 'Add to group' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('shows dashes for null registry fields and null lastUpdated', () => {
    renderCard({
      registry: { ...registry, first_seen_at: null, last_seen_at: null, last_trade_at: null },
      lastUpdated: null,
    });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows relative last-updated text', () => {
    const recent = new Date(Date.now() - 1000).toISOString();
    renderCard({ lastUpdated: recent });
    expect(screen.getByText('Last updated just now')).toBeInTheDocument();
  });

  it('omits the leaderboard badge for non-leaderboard sources', () => {
    renderCard({ registry: { ...registry, discovery_source: 'manual' } });
    expect(screen.queryByRole('img', { name: 'Leaderboard' })).not.toBeInTheDocument();
    expect(screen.queryByText('Leaderboard')).not.toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('renders the ready status line with metrics as-of when metrics are ready', () => {
    renderCard({ metrics: { ...baseMetrics, data_status: 'ready', is_partial: false } });
    expect(screen.getByText(/Ready/)).toBeInTheDocument();
    expect(screen.getByText(/Metrics as of/)).toBeInTheDocument();
    expect(screen.queryByText(/Partial data/)).not.toBeInTheDocument();
  });

  it('renders the error status line when metrics data_status is error', () => {
    renderCard({ metrics: { ...baseMetrics, data_status: 'error', is_partial: false } });
    expect(screen.getByText(/Error/)).toBeInTheDocument();
    expect(screen.getByText(/Metrics as of/)).toBeInTheDocument();
  });

  it('appends the partial marker while keeping the status line visible', () => {
    renderCard({ metrics: { ...baseMetrics, data_status: 'ready', is_partial: true } });
    expect(screen.getByText(/Ready/)).toBeInTheDocument();
    expect(screen.getByText(/Partial data/)).toBeInTheDocument();
  });

  it('hides the status line when metrics are null', () => {
    renderCard({ metrics: null });
    expect(screen.queryByText(/Ready/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Metrics as of/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Partial data/)).not.toBeInTheDocument();
  });
});
