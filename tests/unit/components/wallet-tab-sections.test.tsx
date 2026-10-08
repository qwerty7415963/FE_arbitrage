import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { BalancesSection } from '@/app/[locale]/(protected)/traders/[address]/_components/balances-section';
import { OrdersSection } from '@/app/[locale]/(protected)/traders/[address]/_components/orders-section';
import { FillsSection } from '@/app/[locale]/(protected)/traders/[address]/_components/fills-section';
import { TransfersSection } from '@/app/[locale]/(protected)/traders/[address]/_components/transfers-section';
import { PerformanceSection } from '@/app/[locale]/(protected)/traders/[address]/_components/performance-section';
import { useTraderBalances } from '@/hooks/use-trader-balances';
import { useTraderOrders } from '@/hooks/use-trader-orders';
import { useTraderFills } from '@/hooks/use-trader-fills';
import { useTraderTransfers } from '@/hooks/use-trader-transfers';
import { useTraderPerformance } from '@/hooks/use-trader-performance';
import enMessages from '@/messages/en.json';

vi.mock('@/hooks/use-trader-balances', () => ({ useTraderBalances: vi.fn() }));
vi.mock('@/hooks/use-trader-orders', () => ({ useTraderOrders: vi.fn() }));
vi.mock('@/hooks/use-trader-fills', () => ({ useTraderFills: vi.fn() }));
vi.mock('@/hooks/use-trader-transfers', () => ({ useTraderTransfers: vi.fn() }));
vi.mock('@/hooks/use-trader-performance', () => ({ useTraderPerformance: vi.fn() }));

const WALLET = '0x1111111111111111111111111111111111111111';

function renderWithIntl(children: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>,
  );
}

const balancesFixture = {
  perp: {
    account_value: 12345.67,
    total_ntl_pos: 5000,
    total_margin_used: 800,
    withdrawable: 11000,
    cross_account_value: 12345.67,
    cross_total_ntl_pos: 5000,
    cross_total_margin_used: 800,
    asset_positions_value: 5000,
    as_of: '2026-10-08T00:00:00Z',
  },
  spot: {
    balances: [
      { coin: 'USDC', token: '0', total: 100, hold: 0, entry_ntl: 0 },
      { coin: 'HYPE', token: '150', total: 5, hold: 0, entry_ntl: 120 },
    ],
    as_of: '2026-10-08T00:00:00Z',
  },
  data_status: 'ready' as const,
};

const openOrder = {
  coin: 'BTC',
  side: 'BUY' as const,
  limit_px: 29792,
  size: 5,
  orig_size: 5,
  oid: 91490942,
  timestamp: '2026-10-08T00:00:00Z',
  reduce_only: false,
  order_type: 'Limit',
  trigger_condition: 'N/A',
  trigger_px: 0,
  is_position_tpsl: false,
  order_status: null,
  status_timestamp: null,
};

const fillFixture = {
  coin: 'ETH',
  side: 'SELL' as const,
  dir: 'Close Long',
  size: 8.97,
  price: 2309.1,
  closed_pnl: 19.19,
  fee: -0.62,
  fee_token: 'USDC',
  time: '2026-10-08T00:00:00Z',
  tid: 1101266132350103,
  oid: 391239781497,
  crossed: false,
  start_position: '8.97',
};

const transferFixture = {
  time: '2026-10-08T00:00:00Z',
  hash: '0xabc',
  type: 'subAccountTransfer' as const,
  usdc: 50000,
  token: null,
  amount: null,
  usdc_value: null,
  is_deposit: null,
  source_dex: null,
  destination_dex: null,
  counterparty: '0x2222222222222222222222222222222222222222',
};

const performanceFixture = {
  period: '30D' as const,
  metrics: {
    roi: 0.2,
    pnl: 1000,
    win_rate: 0.66,
    volume: 100000,
    trade_count: 30,
    profit_factor: 2.1,
    max_drawdown_pct: 12.5,
    long_wins: 24,
    long_count: 30,
    short_wins: 10,
    short_count: 20,
    data_status: 'ready' as const,
    is_partial: false,
    metrics_as_of: '2026-10-08T00:00:00Z',
  },
  equity: [{ date: '2026-10-01', end_equity: 10000, daily_return: 0.01 }],
};

describe('wallet tab sections', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('balances renders perp cards and spot rows from the fixture', () => {
    vi.mocked(useTraderBalances).mockReturnValue({
      balances: balancesFixture,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithIntl(<BalancesSection walletAddress={WALLET} />);
    expect(screen.getByText('Perp account')).toBeInTheDocument();
    expect(screen.getByText('Withdrawable')).toBeInTheDocument();
    expect(screen.getByText('$11.00K')).toBeInTheDocument();
    expect(screen.getByText('HYPE')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('balances shows the empty state and retries after an error', () => {
    vi.mocked(useTraderBalances).mockReturnValue({
      balances: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithIntl(<BalancesSection walletAddress={WALLET} />);
    expect(screen.getByText('No balances')).toBeInTheDocument();

    const refetch = vi.fn();
    vi.mocked(useTraderBalances).mockReturnValue({
      balances: null,
      isLoading: false,
      error: new Error('boom'),
      refetch,
    });
    renderWithIntl(<BalancesSection walletAddress={WALLET} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('orders renders open rows without status columns', () => {
    vi.mocked(useTraderOrders).mockReturnValue({
      orders: { status: 'open', rows: [openOrder] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithIntl(<OrdersSection walletAddress={WALLET} />);
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.queryByText('filled')).not.toBeInTheDocument();
  });

  it('orders shows status columns for historical rows', () => {
    vi.mocked(useTraderOrders).mockReturnValue({
      orders: {
        status: 'historical',
        rows: [{ ...openOrder, order_status: 'filled', status_timestamp: '2026-10-08T01:00:00Z' }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithIntl(<OrdersSection walletAddress={WALLET} />);
    expect(screen.getByText('filled')).toBeInTheDocument();
  });

  it('orders renders the empty state', () => {
    vi.mocked(useTraderOrders).mockReturnValue({
      orders: { status: 'open', rows: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithIntl(<OrdersSection walletAddress={WALLET} />);
    expect(screen.getByText('No orders')).toBeInTheDocument();
  });

  it('fills renders the fixture row with fee and time', () => {
    vi.mocked(useTraderFills).mockReturnValue({
      fills: [fillFixture],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      isFetchingNextPage: false,
    });
    renderWithIntl(<FillsSection walletAddress={WALLET} />);
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
    expect(screen.getByText('Close Long')).toBeInTheDocument();
    expect(screen.getByText(/USDC/)).toBeInTheDocument();
  });

  it('fills renders the empty state', () => {
    vi.mocked(useTraderFills).mockReturnValue({
      fills: [],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      isFetchingNextPage: false,
    });
    renderWithIntl(<FillsSection walletAddress={WALLET} />);
    expect(screen.getByText('No fills')).toBeInTheDocument();
  });

  it('transfers renders the fixture row with type and hash', () => {
    vi.mocked(useTraderTransfers).mockReturnValue({
      transfers: [transferFixture],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      isFetchingNextPage: false,
    });
    renderWithIntl(<TransfersSection walletAddress={WALLET} />);
    expect(screen.getByText('subAccountTransfer')).toBeInTheDocument();
    expect(screen.getByText('$50.00K')).toBeInTheDocument();
  });

  it('transfers renders the empty state', () => {
    vi.mocked(useTraderTransfers).mockReturnValue({
      transfers: [],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      isFetchingNextPage: false,
    });
    renderWithIntl(<TransfersSection walletAddress={WALLET} />);
    expect(screen.getByText('No transfers')).toBeInTheDocument();
  });

  it('performance renders metrics and the equity curve', () => {
    vi.mocked(useTraderPerformance).mockReturnValue({
      performance: performanceFixture,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderWithIntl(<PerformanceSection walletAddress={WALLET} />);
    expect(screen.getByText('Equity curve')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
    expect(screen.getByText('$10.00K')).toBeInTheDocument();
  });
});
