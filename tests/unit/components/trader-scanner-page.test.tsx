import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ApiError } from '@/infrastructure/api-client';
import ScannerPage from '@/app/[locale]/(protected)/wallets/page';
import { listTraderGroups, searchTraders } from '@/services/traders';
import type { PeriodMetrics } from '@/types/trader';
import enMessages from '@/messages/en.json';

const nav = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => nav.params,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/services/traders', () => ({
  listTraderGroups: vi.fn(),
  searchTraders: vi.fn(),
}));

vi.mock('@/components/shared/auth/connect-wallet-button', () => ({
  ConnectWalletButton: () => <button type="button">Connect stub</button>,
}));

function makeRow(address: string, overrides: Partial<PeriodMetrics> = {}): PeriodMetrics {
  return {
    wallet_address: address,
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: null,
    pnl: 100,
    realized_pnl: 100,
    roi: 10,
    win_rate: 60,
    volume: 5000,
    trade_count: 20,
    profit_factor: 1.5,
    max_drawdown_pct: null,
    long_count: 10,
    long_wins: 6,
    short_count: 10,
    short_wins: 6,
    gross_profit: null,
    gross_loss: null,
    avg_trade_pnl: null,
    avg_holding_time_sec: null,
    last_trade_at: null,
    data_status: 'ready',
    is_partial: false,
    metrics_as_of: null,
    calculation_version: 1,
    ...overrides,
  };
}

const ROW_A = makeRow('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const ROW_B = makeRow('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScannerPage />
    </NextIntlClientProvider>,
  );
}

describe('TradersScannerPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    nav.params = new URLSearchParams();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(listTraderGroups).mockResolvedValue([]);
    vi.mocked(searchTraders).mockResolvedValue({ data: [ROW_A], meta: {} });
  });

  it('shows default controls without auto-searching', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Trader Scanner' })).toBeInTheDocument();
    expect(screen.getByLabelText('Period')).toHaveValue('30D');
    expect(searchTraders).not.toHaveBeenCalled();
  });

  it('searches with merged defaults and syncs the URL', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('ROI Min'), '30');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(searchTraders).toHaveBeenCalledWith(
      expect.objectContaining({
        venue: 'hyperliquid',
        period: '30D',
        roi: { min: 30 },
        sortBy: 'pnl',
        sortDirection: 'desc',
        limit: 20,
      }),
      expect.anything(),
    );
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(screen.getByText('1 results')).toBeInTheDocument();
    expect(nav.push).toHaveBeenCalledWith(expect.stringContaining('roi_min=30'), expect.anything());
    expect(window.sessionStorage.getItem('trader.last-scan.v1')).toContain('roi_min=30');
  });

  it('shows a skeleton on first search', async () => {
    const user = userEvent.setup();
    let resolveSearch: ((v: { data: PeriodMetrics[]; meta: object }) => void) | null = null;
    vi.mocked(searchTraders).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('status', { name: 'Loading...' })).toBeInTheDocument();
    resolveSearch!({ data: [ROW_A], meta: {} });
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
  });

  it('blocks invalid filters without calling the API', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('ROI Min'), '5');
    await user.type(screen.getByLabelText('ROI Max'), '1');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Min must be less than or equal to max')).toBeInTheDocument();
    expect(searchTraders).not.toHaveBeenCalled();
  });

  it('blocks non-numeric input', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('PnL Min'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Filter value must be a valid number')).toBeInTheDocument();
    expect(searchTraders).not.toHaveBeenCalled();
  });

  it('toggles sort direction via header click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('0xaaaa...aaaa');
    const pnlHeader = screen.getByRole('columnheader', { name: 'PnL' });
    await user.click(within(pnlHeader).getByRole('button', { name: 'PnL' }));
    expect(searchTraders).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'pnl', sortDirection: 'asc', cursor: undefined }),
      expect.anything(),
    );
  });

  it('appends deduplicated rows on load more', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders)
      .mockResolvedValueOnce({ data: [ROW_A], meta: { has_more: true, cursor: 'c1' } })
      .mockResolvedValueOnce({ data: [ROW_A, ROW_B], meta: { has_more: false } });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(searchTraders).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'c1' }),
      expect.anything(),
    );
    expect(await screen.findByText('0xbbbb...bbbb')).toBeInTheDocument();
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('shows error with retry and recovers', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ data: [ROW_B], meta: {} });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('An error occurred, please try again')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('0xbbbb...bbbb')).toBeInTheDocument();
  });

  it('keeps old rows with progress during a new search', async () => {
    const user = userEvent.setup();
    let resolveSecond: ((v: { data: PeriodMetrics[]; meta: object }) => void) | null = null;
    vi.mocked(searchTraders)
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('0xaaaa...aaaa');
    await user.type(screen.getByLabelText('ROI Min'), '50');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    resolveSecond!({ data: [ROW_B], meta: {} });
    expect(await screen.findByText('0xbbbb...bbbb')).toBeInTheDocument();
  });

  it('lets the latest overlapping search win', async () => {
    const user = userEvent.setup();
    let resolveSecond: ((v: { data: PeriodMetrics[]; meta: object }) => void) | null = null;
    vi.mocked(searchTraders)
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      )
      .mockResolvedValue({ data: [ROW_B], meta: {} });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('0xaaaa...aaaa');
    await user.type(screen.getByLabelText('ROI Min'), '30');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    const pnlHeader = screen.getByRole('columnheader', { name: 'PnL' });
    await user.click(within(pnlHeader).getByRole('button', { name: 'PnL' }));
    await screen.findByText('0xbbbb...bbbb');
    resolveSecond!({ data: [ROW_A], meta: {} });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('0xaaaa...aaaa')).not.toBeInTheDocument();
    expect(screen.getByText('0xbbbb...bbbb')).toBeInTheDocument();
  });

  it('resets filters, rows and URL', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('ROI Min'), '30');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('0xaaaa...aaaa');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('ROI Min')).toHaveValue('');
    expect(screen.queryByText('0xaaaa...aaaa')).not.toBeInTheDocument();
    expect(nav.push).toHaveBeenLastCalledWith('/en/wallets', expect.anything());
  });

  it('restores state from URL and auto-searches', async () => {
    nav.params = new URLSearchParams('period=7D&roi_min=30&sort_by=roi');
    renderPage();
    expect(screen.getByLabelText('Period')).toHaveValue('7D');
    expect(screen.getByLabelText('ROI Min')).toHaveValue('30');
    expect(searchTraders).toHaveBeenCalledWith(
      expect.objectContaining({ period: '7D', roi: { min: 30 }, sortBy: 'roi' }),
      expect.anything(),
    );
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
  });

  it('shows group auth hint when groups fail to load', async () => {
    vi.mocked(listTraderGroups).mockRejectedValue(new ApiError(403, 'AUTH-005', 'denied'));
    renderPage();
    expect(await screen.findByText('Connect your wallet to filter by group')).toBeInTheDocument();
  });
});
