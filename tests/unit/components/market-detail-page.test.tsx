import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketDetailPage from '@/app/[locale]/(protected)/traders/markets/[market]/page';
import { useMarketDetail } from '@/hooks/use-market-detail';
import type { MarketDetailResponse } from '@/types/trader';
import enMessages from '@/messages/en.json';

const nav = vi.hoisted(() => ({
  params: new URLSearchParams(
    'venue=hyperliquid&from=2026-01-01T00:00:00.000Z&to=2026-01-08T00:00:00.000Z',
  ),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en', market: 'BTC' }),
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  usePathname: () => '/en/traders/markets/BTC',
  useSearchParams: () => nav.params,
}));

const detailData: MarketDetailResponse = {
  header: {
    venue: 'hyperliquid',
    market: 'BTC',
    mark_price: 100,
    index_price: 99,
    funding_rate: 0.0001,
    next_funding_at: '2026-01-08T00:00:00Z',
    market_oi: 1000,
    logo_url: '',
    category: 'crypto',
    enabled: true,
    as_of: '2026-01-08T00:00:00Z',
  },
  snapshot: {
    open_notional_long: 500,
    open_notional_short: 200,
    long_short_ratio: 2.5,
    unrealized_pnl_long: 10,
    unrealized_pnl_short: -5,
    net_unrealized_pnl: 5,
    traders_long: 3,
    traders_short: 2,
    traders_total: 5,
    margin_used_long: 100,
    margin_used_short: 50,
    margin_used_total: 150,
    avg_leverage_long: 2,
    avg_leverage_short: 1.5,
    market_oi: 1000,
    synced_at: '2026-01-08T00:00:00Z',
  },
  coverage: { tracked_wallets_with_positions: 5, total_wallets_in_market: 10 },
};

vi.mock('@/hooks/use-market-detail', () => ({
  useMarketDetail: vi.fn(),
}));

vi.mock('@/hooks/use-market-wallets', () => ({
  useMarketWallets: vi.fn(() => ({
    data: {
      data: [
        {
          address: '0x1111111111111111111111111111111111111111',
          display_name: 'Trader One',
          cohort: 'medium',
          bias: 'bullish',
          volume: 1000,
          trades: 10,
          win_rate: 60,
          realized_pnl: 100,
          long_count: 6,
          short_count: 4,
          last_trade_at: '2026-01-08T00:00:00Z',
          position_side: 'LONG',
          position_notional: 500,
          position_upnl: 50,
          position_leverage: 2,
          margin_used: 100,
        },
      ],
      meta: { page: 1, total: 1, total_pages: 1, limit: 20, has_more: false },
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <MarketDetailPage />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('MarketDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMarketDetail).mockReturnValue({
      data: detailData,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it('renders header, snapshot ribbon and wallet table', async () => {
    renderPage();
    expect(await screen.findByTestId('market-header')).toBeInTheDocument();
    expect(screen.getByTestId('market-snapshot-ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('market-wallet-table')).toBeInTheDocument();
    expect(screen.getByText('Trader One')).toBeInTheDocument();
    expect(screen.getByText('Tracked wallets · Synced')).toBeInTheDocument();
  });

  it('does not render the leverage row', async () => {
    renderPage();
    expect(await screen.findByTestId('market-snapshot-ribbon')).toBeInTheDocument();
    expect(screen.queryByText('Lev')).not.toBeInTheDocument();
    expect(screen.queryByText('Leverage')).not.toBeInTheDocument();
  });

  it('renders an em dash instead of the ratio bar when there is no open notional', async () => {
    vi.mocked(useMarketDetail).mockReturnValue({
      data: {
        ...detailData,
        snapshot: {
          ...detailData.snapshot,
          open_notional_long: 0,
          open_notional_short: 0,
        },
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();
    const ribbon = await screen.findByTestId('market-snapshot-ribbon');
    expect(within(ribbon).getByText('—')).toBeInTheDocument();
    expect(within(ribbon).queryByText('0%')).not.toBeInTheDocument();
  });
});
