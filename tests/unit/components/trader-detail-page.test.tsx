import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/infrastructure/api-client';
import DetailPage from '@/app/[locale]/(protected)/traders/[address]/page';
import {
  fetchTraderDetail,
  fetchTraderPositions,
  listTraderGroups,
  triggerTraderSync,
} from '@/services/traders';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import type { TraderDetail } from '@/types/trader';
import enMessages from '@/messages/en.json';

const nav = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en', address: nav.address }),
  useRouter: () => ({ back: nav.back, push: nav.push, replace: vi.fn() }),
  usePathname: () => `/en/traders/${nav.address}`,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/services/traders', () => ({
  fetchTraderDetail: vi.fn(),
  fetchTraderPositions: vi.fn(),
  fetchTraderActivity: vi.fn(),
  triggerTraderSync: vi.fn(),
  listTraderGroups: vi.fn(),
  addGroupMembers: vi.fn(),
  createTraderGroup: vi.fn(),
}));

vi.mock('@/hooks/use-trader-activity', () => ({
  useTraderActivity: vi.fn(),
}));

vi.mock('@/lib/stores/auth', () => ({
  useAuthStore: { getState: () => ({ requireAuth: () => true }) },
}));

const detail: TraderDetail = {
  registry: {
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
  },
  metrics: {
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
  },
  period: '30D',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DetailPage />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('TraderDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    nav.address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    vi.mocked(fetchTraderDetail).mockResolvedValue(detail);
    vi.mocked(listTraderGroups).mockResolvedValue([]);
    vi.mocked(triggerTraderSync).mockResolvedValue({ status: 'queued' });
    vi.mocked(fetchTraderPositions).mockResolvedValue({
      summary: null,
      positions: [],
      data_status: 'ready',
      as_of: null,
    });
    vi.mocked(useTraderActivity).mockReturnValue({
      trades: [],
      liveFills: [],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      live: 'disconnected',
      dataStatus: 'ready',
    });
  });

  it('blocks invalid addresses without fetching', () => {
    nav.address = 'not-an-address';
    renderPage();
    expect(screen.getByText('Invalid wallet address')).toBeInTheDocument();
    expect(fetchTraderDetail).not.toHaveBeenCalled();
  });

  it('renders header, cards, tabs and long/short stats', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Smart Money' })).toBeInTheDocument();
    expect(screen.getByText('+25.00%')).toBeInTheDocument();
    expect(screen.getByText('+$5.00K')).toBeInTheDocument();
    expect(screen.getByText('70.00%')).toBeInTheDocument();
    expect(screen.getByText('80.00% · 24 of 30 won')).toBeInTheDocument();
    expect(screen.getByText('50.00% · 10 of 20 won')).toBeInTheDocument();
    expect(screen.getAllByText(/Ready/).length).toBeGreaterThan(0);
    expect(fetchTraderDetail).toHaveBeenCalledWith(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      expect.objectContaining({ period: '30D' }),
    );
  });

  it('refetches on period switch', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await user.click(screen.getByRole('button', { name: '7D' }));
    expect(fetchTraderDetail).toHaveBeenLastCalledWith(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      expect.objectContaining({ period: '7D' }),
    );
  });

  it('shows dashes when metrics are null', async () => {
    vi.mocked(fetchTraderDetail).mockResolvedValue({ ...detail, metrics: null });
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows stale and partial states while keeping data visible', async () => {
    vi.mocked(fetchTraderDetail).mockResolvedValue({
      ...detail,
      metrics: { ...detail.metrics!, data_status: 'stale', is_partial: true },
    });
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    expect(screen.getByText(/Stale/)).toBeInTheDocument();
    expect(screen.getByText(/Partial data/)).toBeInTheDocument();
    expect(screen.getByText('+$5.00K')).toBeInTheDocument();
  });

  it('shows not found on 404 with retry recovery', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchTraderDetail)
      .mockRejectedValueOnce(new ApiError(404, 'COMMON-903', 'not found'))
      .mockResolvedValueOnce(detail);
    renderPage();
    expect(await screen.findByText('Trader not found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'Smart Money' })).toBeInTheDocument();
  });

  it('goes back and opens add-to-group modal', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await user.click(screen.getByRole('button', { name: 'Back to scanner' }));
    expect(nav.back).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Add to group' }));
    expect(await screen.findByText('Add wallets to group')).toBeInTheDocument();
  });

  it('pushes the stored scan when going back', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem('trader.last-scan.v1', 'period=7D&roi_min=25');
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await user.click(screen.getByRole('button', { name: 'Back to scanner' }));
    expect(nav.push).toHaveBeenCalledWith('/en/traders?period=7D&roi_min=25');
    expect(nav.back).not.toHaveBeenCalled();
    window.sessionStorage.clear();
  });

  it('auto-triggers one priority sync when trades are empty', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await waitFor(() =>
      expect(triggerTraderSync).toHaveBeenCalledWith('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    );
    await waitFor(() => expect(triggerTraderSync).toHaveBeenCalledTimes(1));
  });

  it('auto-triggers when positions are not ready even with trades present', async () => {
    vi.mocked(fetchTraderPositions).mockResolvedValue({
      summary: null,
      positions: [],
      data_status: 'syncing',
      as_of: null,
    });
    vi.mocked(useTraderActivity).mockReturnValue({
      trades: [
        {
          market: 'BTC',
          side: 'LONG',
          opened_at: '2026-10-06T08:00:00Z',
          closed_at: '2026-10-06T08:30:00Z',
          duration_sec: 1800,
          volume: 30000,
          entry_price: 60000,
          exit_price: 62000,
          pnl: 1500,
          fees: 30,
          net_pnl: 1470,
          fills: 3,
        },
      ],
      liveFills: [],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      live: 'disconnected',
      dataStatus: 'syncing',
    });
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await waitFor(() => expect(triggerTraderSync).toHaveBeenCalledTimes(1));
  });

  it('does not auto-trigger when positions are ready and trades exist', async () => {
    vi.mocked(useTraderActivity).mockReturnValue({
      trades: [
        {
          market: 'BTC',
          side: 'LONG',
          opened_at: '2026-10-06T08:00:00Z',
          closed_at: '2026-10-06T08:30:00Z',
          duration_sec: 1800,
          volume: 30000,
          entry_price: 60000,
          exit_price: 62000,
          pnl: 1500,
          fees: 30,
          net_pnl: 1470,
          fills: 3,
        },
      ],
      liveFills: [],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      hasMore: false,
      live: 'disconnected',
      dataStatus: 'ready',
    });
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    // Let the sync effect settle after both signals load.
    await waitFor(() => expect(fetchTraderPositions).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(triggerTraderSync).not.toHaveBeenCalled();
  });

  it('does not repeat the auto-trigger on period switch', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await waitFor(() => expect(triggerTraderSync).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: '7D' }));
    await waitFor(() =>
      expect(fetchTraderDetail).toHaveBeenLastCalledWith(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        expect.objectContaining({ period: '7D' }),
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(triggerTraderSync).toHaveBeenCalledTimes(1);
  });

  it('Sync now in Recent Activity posts and refetches', async () => {
    const user = userEvent.setup();
    const activityRefetch = vi.fn();
    vi.mocked(useTraderActivity).mockReturnValue({
      trades: [],
      liveFills: [],
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      refetch: activityRefetch,
      hasMore: false,
      live: 'disconnected',
      dataStatus: 'ready',
    });
    renderPage();
    await screen.findByRole('heading', { name: 'Smart Money' });
    await waitFor(() => expect(triggerTraderSync).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(triggerTraderSync).toHaveBeenCalledTimes(2));
    expect(activityRefetch).toHaveBeenCalled();
  });
});
