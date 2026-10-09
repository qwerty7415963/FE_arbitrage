import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletTabs } from '@/app/[locale]/(protected)/traders/[address]/_components/wallet-tabs';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import enMessages from '@/messages/en.json';

let mockTab: string | null = null;
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockTab ? `tab=${mockTab}` : ''),
  usePathname: () => '/en/traders/0x1111111111111111111111111111111111111111',
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace }),
}));

vi.mock('@/hooks/use-trader-positions', () => ({
  useTraderPositions: vi.fn(),
}));

vi.mock('@/hooks/use-trader-trades', () => ({
  useTraderTrades: vi.fn(() => ({
    trades: [],
    counts: null,
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    hasMore: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock('@/hooks/use-trader-balances', () => ({
  useTraderBalances: vi.fn(() => ({
    balances: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-trader-fills', () => ({
  useTraderFills: vi.fn(() => ({
    fills: [],
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    hasMore: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock('@/hooks/use-trader-orders', () => ({
  useTraderOrders: vi.fn(() => ({ orders: null, isLoading: false, error: null, refetch: vi.fn() })),
}));

vi.mock('@/hooks/use-trader-transfers', () => ({
  useTraderTransfers: vi.fn(() => ({
    transfers: [],
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    hasMore: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock('@/hooks/use-trader-performance', () => ({
  useTraderPerformance: vi.fn(() => ({
    performance: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

const WALLET = '0x1111111111111111111111111111111111111111';

const positionSnapshot = {
  summary: {
    account_value: 12345.67,
    total_ntl_pos: 5000,
    total_margin_used: 800,
    as_of: '2026-10-08T00:00:00Z',
  },
  positions: [
    {
      coin: 'BTC',
      side: 'LONG' as const,
      size: 0.5,
      entry_price: 60000,
      mark_price: 61000,
      position_value: 30500,
      unrealized_pnl: 500,
      return_on_equity: 0.12,
      liquidation_price: 45000,
      leverage: 10,
      max_leverage: 40,
      margin_used: 3050,
      as_of: '2026-10-08T00:00:00Z',
    },
  ],
  data_status: 'ready' as const,
  as_of: '2026-10-08T00:00:00Z',
};

function renderTabs() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <WalletTabs walletAddress={WALLET} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('WalletTabs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockTab = null;
    vi.mocked(useTraderPositions).mockReturnValue({
      snapshot: positionSnapshot,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders nine tabs with positions active and rows visible by default', () => {
    renderTabs();
    for (const label of [
      'Positions',
      'Balances',
      'Predictions',
      'Orders',
      'Fills',
      'Trades',
      'Swap',
      'Transfers',
      'Performance',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('tab', { name: 'Positions' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('writes ?tab= to the URL when a tab is picked', () => {
    renderTabs();
    fireEvent.click(screen.getByRole('tab', { name: 'Balances' }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('tab=balances'), {
      scroll: false,
    });
  });

  it('restores the active tab from ?tab=', () => {
    mockTab = 'trades';
    vi.mocked(useTraderTrades).mockReturnValue({
      trades: [],
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
      dataStatus: 'ready',
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      isFetchingNextPage: false,
    });
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Trades' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No closed trades')).toBeInTheDocument();
  });

  it('renders coming-soon placeholders for predictions and swap without data', () => {
    mockTab = 'predictions';
    renderTabs();
    expect(screen.getByText('Predictions coming soon')).toBeInTheDocument();

    mockTab = 'swap';
    renderTabs();
    expect(screen.getByText('Swap coming soon')).toBeInTheDocument();
  });

  it('requests server-side positions sort when a sortable header is clicked', () => {
    renderTabs();
    fireEvent.click(screen.getByRole('button', { name: /uPnL/ }));
    const lastCall = vi.mocked(useTraderPositions).mock.calls.at(-1);
    expect(lastCall?.[1]).toMatchObject({ sort: 'unrealized_pnl', dir: 'asc' });
  });
});
