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

describe('ActivityFeed', () => {
  it('renders a live fill with LIVE badge and a closed trade', () => {
    renderFeed({ trades, liveFills, live: 'connected' });
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    renderFeed();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
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

  it('shows a syncing skeleton (not a definitive empty) while syncing + empty', () => {
    renderFeed({ dataStatus: 'syncing' });
    expect(screen.getByRole('status', { name: 'Syncing activity...' })).toBeInTheDocument();
    expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
  });

  it('shows the genuine empty state only when ready + empty', () => {
    renderFeed({ dataStatus: 'ready' });
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Syncing activity...' })).not.toBeInTheDocument();
  });

  it('offers Sync now on the syncing skeleton as a manual fallback', () => {
    const onSyncNow = vi.fn();
    renderFeed({ dataStatus: 'syncing', onSyncNow });
    const button = screen.getByRole('button', { name: 'Sync now' });
    fireEvent.click(button);
    expect(onSyncNow).toHaveBeenCalledTimes(1);
  });

  it('offers Sync now on the genuine empty state as a manual fallback', () => {
    const onSyncNow = vi.fn();
    renderFeed({ dataStatus: 'ready', onSyncNow });
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeInTheDocument();
  });

  it('hides Sync now when no handler is wired', () => {
    renderFeed({ dataStatus: 'syncing' });
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument();
  });
});
