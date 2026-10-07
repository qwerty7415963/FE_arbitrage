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
    volume: 30000,
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
});
