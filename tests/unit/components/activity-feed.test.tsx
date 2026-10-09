import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityFeed } from '@/app/[locale]/(protected)/traders/[address]/_components/activity-feed';
import enMessages from '@/messages/en.json';

const trades = [
  {
    market: 'BTC',
    side: 'LONG' as const,
    opened_at: '2026-10-06T08:00:00Z',
    closed_at: '2026-10-06T08:30:00Z',
    duration_sec: 1800,
    volume: 30000,
    entry_price: 60000,
    exit_price: 62000,
    pnl: 1500,
    fees: 30,
    funding: -12.5,
    net_pnl: 1470,
    fills: 3,
  },
];

const liveFills = [
  {
    coin: 'ETH',
    side: 'BUY' as const,
    size: 0.1,
    price: 3000,
    time: '2026-10-06T09:01:00Z',
    tid: 12345,
  },
];

function renderFeed(props: Partial<React.ComponentProps<typeof ActivityFeed>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ActivityFeed
        trades={[]}
        liveFills={[]}
        isLoading={false}
        error={null}
        hasMore={false}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
        live="disconnected"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('ActivityFeed (contract v1.2)', () => {
  it('renders a live fill with LIVE badge and a closed trade', () => {
    renderFeed({ trades, liveFills, live: 'connected', connection: 'LIVE' });
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('gates the LIVE badge on the backend connection state', () => {
    const { unmount } = renderFeed({ trades, live: 'connected', connection: 'RECONNECTING' });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    unmount();
    renderFeed({ trades, live: 'connected', connection: 'ERROR' });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('shows no LIVE badge while the transport is disconnected', () => {
    renderFeed({ trades, live: 'disconnected', connection: 'LIVE' });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('renders the genuine empty state with no Sync now button', () => {
    renderFeed({ dataStatus: 'ready' });
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument();
  });

  it('shows as_of and partial markers', () => {
    renderFeed({ trades, asOf: '2026-10-08T00:00:00Z', partial: true });
    expect(screen.getByText(/As of/)).toBeInTheDocument();
    expect(screen.getByText(/Partial data/)).toBeInTheDocument();
  });

  it('renders live funding events incrementally', () => {
    renderFeed({
      liveFundings: [{ coin: 'ETH', usdc: -3.44, time: '2026-10-08T00:00:00Z' }],
      live: 'connected',
      connection: 'LIVE',
    });
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('-$3.44')).toBeInTheDocument();
  });

  it('shows load more when hasMore', () => {
    const onLoadMore = vi.fn();
    renderFeed({ trades, hasMore: true, onLoadMore });
    const button = screen.getByRole('button', { name: 'Load more' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('retries the initial page via onRetry (not onLoadMore)', () => {
    const onLoadMore = vi.fn();
    const onRetry = vi.fn();
    renderFeed({ error: new Error('boom'), onLoadMore, onRetry });
    const button = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
