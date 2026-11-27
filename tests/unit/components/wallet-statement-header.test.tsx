import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { WalletStatementHeader } from '@/app/[locale]/(protected)/traders/[address]/_components/wallet-statement-header';
import type { OpenPosition, PeriodMetrics, PositionSummary, RegistryEntry } from '@/types/trader';
import enMessages from '@/messages/en.json';
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

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

const summary: PositionSummary = {
  account_value: 12345.6,
  total_ntl_pos: 5000,
  total_margin_used: 800,
  as_of: '2026-10-06T09:00:00Z',
};

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

function position(
  coin: string,
  unrealized_pnl: number | null,
  overrides: Partial<OpenPosition> = {},
): OpenPosition {
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
    ...overrides,
  };
}

function stubMatchMedia(matches: boolean) {
  const mql = {
    matches,
    media: '(max-width: 1023px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return mql;
}

function renderHeader(props: Partial<React.ComponentProps<typeof WalletStatementHeader>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <WalletStatementHeader
        registry={registry}
        summary={summary}
        positions={[position('BTC', 1500), position('ETH', -200)]}
        metrics={metrics}
        lastUpdated="2024-01-02T01:00:00Z"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WalletStatementHeader', () => {
  it('renders the hero account value and identity', () => {
    stubMatchMedia(false);
    renderHeader();
    expect(screen.getByRole('heading', { name: 'Smart Money' })).toBeInTheDocument();
    expect(screen.getByText('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBeInTheDocument();
    expect(screen.getByText('hyperliquid')).toBeInTheDocument();
    expect(screen.getByText('Account value')).toBeInTheDocument();
    expect(screen.getByText('$12.35K')).toBeInTheDocument();
  });

  it('renders derived available margin, margin usage, leverage and summed uPnL', () => {
    stubMatchMedia(false);
    renderHeader();
    expect(screen.getByText('Available margin')).toBeInTheDocument();
    expect(screen.getByText('$11.55K')).toBeInTheDocument();
    expect(screen.getByText('uPnL')).toBeInTheDocument();
    expect(screen.getByText('+$1,300')).toBeInTheDocument();
    expect(screen.getByText('$5.00K')).toBeInTheDocument();
    expect(screen.getByText('$800.00')).toBeInTheDocument();
    expect(screen.getByText('6.5%')).toBeInTheDocument();
    expect(screen.getByText('0.41×')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '6.5');
  });

  it('sums negative-only uPnL', () => {
    stubMatchMedia(false);
    renderHeader({ positions: [position('BTC', -200), position('ETH', null)] });
    expect(screen.getByText('-$200')).toBeInTheDocument();
  });

  it('renders dashes when summary and positions are null/empty', () => {
    stubMatchMedia(false);
    renderHeader({ summary: null, positions: [] });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(6);
  });

  it('guards margin usage and leverage when account value is not positive', () => {
    stubMatchMedia(false);
    renderHeader({ summary: { ...summary, account_value: 0 } });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps details closed by default on desktop', () => {
    stubMatchMedia(false);
    const { container } = renderHeader();
    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('First seen')).toBeInTheDocument();
  });

  it('opens details by default on mobile via matchMedia', () => {
    stubMatchMedia(true);
    const { container } = renderHeader();
    expect(container.querySelector('details')).toHaveAttribute('open');
  });

  it('shows Follow and calls onToggleFollow when not followed', () => {
    stubMatchMedia(false);
    const onToggleFollow = vi.fn();
    renderHeader({ onToggleFollow });
    const button = screen.getByRole('button', { name: 'Follow' });
    fireEvent.click(button);
    expect(onToggleFollow).toHaveBeenCalledTimes(1);
  });

  it('shows Unfollow, alias, group chips and rename when followed', () => {
    stubMatchMedia(false);
    const onToggleFollow = vi.fn();
    const onRename = vi.fn();
    renderHeader({
      isFollowed: true,
      notifyEnabled: true,
      alias: 'Alpha Wallet',
      inGroups: [{ id: 'g1', name: 'Main' }],
      onToggleFollow,
      onRename,
    });
    expect(screen.getByRole('heading', { name: 'Alpha Wallet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Main' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rename wallet' }));
    const input = screen.getByRole('textbox', { name: 'Rename wallet' });
    fireEvent.change(input, { target: { value: 'Beta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onRename).toHaveBeenCalledWith('Beta');
  });

  it('renders the ready status line with last updated, as-of and partial marker', () => {
    stubMatchMedia(false);
    renderHeader({ metrics: { ...metrics, is_partial: true } });
    expect(screen.getByText(/Ready/)).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    expect(screen.getByText(/Metrics as of/)).toBeInTheDocument();
    expect(screen.getByText(/Partial data/)).toBeInTheDocument();
  });

  it('renders the error status line from metrics data_status', () => {
    stubMatchMedia(false);
    renderHeader({ metrics: { ...metrics, data_status: 'error' } });
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });
});
