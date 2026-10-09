import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TradesSection } from '@/app/[locale]/(protected)/traders/[address]/_components/trades-section';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import enMessages from '@/messages/en.json';

vi.mock('@/hooks/use-trader-trades', () => ({
  useTraderTrades: vi.fn(),
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
  funding: -12.5,
  net_pnl: 1470,
  fills: 3,
};

const counts = { win: 133, loss: 67, long: 112, short: 88, total: 200 };

function mockTrades(overrides: Partial<ReturnType<typeof useTraderTrades>> = {}) {
  vi.mocked(useTraderTrades).mockReturnValue({
    trades: [trade],
    counts,
    dataStatus: 'ready',
    asOf: '2026-10-08T00:00:00Z',
    partial: false,
    live: 'disconnected',
    connection: null,
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    hasMore: false,
    isFetchingNextPage: false,
    ...overrides,
  });
}

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <TradesSection walletAddress={WALLET} />
    </NextIntlClientProvider>,
  );
}

describe('TradesSection (contract v1.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders funding values with net unchanged (net = pnl − fees)', () => {
    mockTrades();
    renderSection();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('LONG')).toBeInTheDocument();
    expect(screen.getByText('$60.00K')).toBeInTheDocument();
    expect(screen.getByText('$62.00K')).toBeInTheDocument();
    expect(screen.getByText('$30.50K')).toBeInTheDocument();
    expect(screen.getByText('2d 12h')).toBeInTheDocument();
    // funding −12.5 is informational; net 1470 = 1500 − 30 is unchanged.
    expect(screen.getByText('-$12.5')).toBeInTheDocument();
    expect(screen.getByText('+$1,470')).toBeInTheDocument();
  });

  it('shows as_of and partial markers from the live page', () => {
    mockTrades({ partial: true });
    renderSection();
    expect(screen.getByText(/As of/)).toBeInTheDocument();
    expect(screen.getByText(/Partial data/)).toBeInTheDocument();
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
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the genuine empty state with no Sync now button', () => {
    mockTrades({ trades: [], counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 } });
    renderSection();
    expect(screen.getByText('No closed trades')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Đồng bộ/ })).not.toBeInTheDocument();
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
});
