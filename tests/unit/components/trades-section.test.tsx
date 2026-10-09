import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TradesSection } from '@/app/[locale]/(protected)/traders/[address]/_components/trades-section';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import { triggerTraderSync } from '@/services/traders';
import enMessages from '@/messages/en.json';

vi.mock('@/hooks/use-trader-trades', () => ({
  useTraderTrades: vi.fn(),
}));

vi.mock('@/services/traders', () => ({
  triggerTraderSync: vi.fn(),
}));

const WALLET = '0x1111111111111111111111111111111111111111';

const trade = {
  market: 'BTC',
  side: 'LONG' as const,
  opened_at: '2026-10-01T00:00:00Z',
  closed_at: '2026-10-03T12:00:00Z',
  duration_sec: 216000,
  volume: 30500,
  entry_price: 60000,
  exit_price: 62000,
  pnl: 1500,
  fees: 30,
  net_pnl: 1470,
  fills: 3,
};

const counts = { win: 133, loss: 67, long: 112, short: 88, total: 200 };

function mockTrades(overrides: Partial<ReturnType<typeof useTraderTrades>> = {}) {
  const { dataStatus, ...rest } = overrides;
  vi.mocked(useTraderTrades).mockReturnValue({
    trades: [trade],
    counts,
    dataStatus: dataStatus ?? 'ready',
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    hasMore: false,
    isFetchingNextPage: false,
    ...rest,
  });
}

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <TradesSection walletAddress={WALLET} />
    </NextIntlClientProvider>,
  );
}

describe('TradesSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the contract columns with entry, exit, notional, duration, funding dash and net pnl', () => {
    mockTrades();
    renderSection();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('LONG')).toBeInTheDocument();
    expect(screen.getByText('$60.00K')).toBeInTheDocument();
    expect(screen.getByText('$62.00K')).toBeInTheDocument();
    expect(screen.getByText('$30.50K')).toBeInTheDocument();
    expect(screen.getByText('2d 12h')).toBeInTheDocument();
    expect(screen.getByText('+$1,470')).toBeInTheDocument();
    const fundingCells = screen.getAllByText('—');
    expect(fundingCells.length).toBeGreaterThan(0);
  });

  it('shows result and side chips with counts from the response', () => {
    mockTrades();
    renderSection();
    expect(screen.getAllByRole('button', { name: 'All (200)' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Win (133)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Loss (67)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Long (112)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Short (88)' })).toBeInTheDocument();
  });

  it('requests server-side sort when a sortable header is clicked', () => {
    mockTrades();
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /Net PnL/ }));
    const lastCall = vi.mocked(useTraderTrades).mock.calls.at(-1);
    expect(lastCall?.[1]).toMatchObject({ sort: 'net_pnl', dir: 'desc' });
  });

  it('filters server-side when a result chip is picked', () => {
    mockTrades();
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Win (133)' }));
    const lastCall = vi.mocked(useTraderTrades).mock.calls.at(-1);
    expect(lastCall?.[1]).toMatchObject({ result: 'win' });
  });

  it('renders dashes for null entry and exit prices', () => {
    mockTrades({ trades: [{ ...trade, entry_price: null, exit_price: null }] });
    renderSection();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the empty state when there are no closed trades', () => {
    mockTrades({ trades: [], counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 } });
    renderSection();
    expect(screen.getByText('No closed trades')).toBeInTheDocument();
  });

  it('retries through refetch after an error', () => {
    const refetch = vi.fn();
    mockTrades({ trades: [], counts: null, error: new Error('boom'), refetch });
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('loads the next page when more rows exist', () => {
    const fetchNextPage = vi.fn();
    mockTrades({ hasMore: true, fetchNextPage });
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('shows a syncing skeleton (not a definitive empty) while syncing + empty', () => {
    mockTrades({
      trades: [],
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
      dataStatus: 'syncing',
    });
    renderSection();
    expect(screen.getByRole('status', { name: 'Syncing trades...' })).toBeInTheDocument();
    expect(screen.queryByText('No closed trades')).not.toBeInTheDocument();
  });

  it('shows Sync now on the genuine empty state as a manual fallback', () => {
    mockTrades({ trades: [], counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 } });
    renderSection();
    expect(screen.getByText('No closed trades')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeInTheDocument();
  });

  it('Sync now POSTs the priority sync and refetches', async () => {
    const refetch = vi.fn();
    vi.mocked(triggerTraderSync).mockResolvedValue({ status: 'queued' });
    mockTrades({
      trades: [],
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
      refetch,
    });
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(triggerTraderSync).toHaveBeenCalledWith(WALLET));
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
  });
});
