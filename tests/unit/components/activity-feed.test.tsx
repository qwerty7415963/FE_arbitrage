import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityFeed } from '@/app/[locale]/(protected)/traders/[address]/_components/activity-feed';
import type { LiveActivityItem } from '@/types/trader';
import enMessages from '@/messages/en.json';

const limitItem: LiveActivityItem = {
  kind: 'limit',
  time: '2026-10-08T00:02:00Z',
  order: {
    coin: 'BTC',
    oid: 91490942,
    status: 'open',
    side: 'BUY',
    limit_px: 60000,
    size: 0.5,
    timestamp: '2026-10-08T00:02:00Z',
  },
};

const fillItem: LiveActivityItem = {
  kind: 'fill',
  time: '2026-10-08T00:01:00Z',
  fill: {
    coin: 'ETH',
    side: 'BUY',
    size: 1.2,
    price: 2309.1,
    time: '2026-10-08T00:01:00Z',
    tid: 1101266132350103,
    dir: 'Open Long',
  },
};

const closeItem: LiveActivityItem = {
  kind: 'close',
  time: '2026-10-08T00:00:00Z',
  trade: {
    market: 'SOL',
    side: 'SHORT',
    opened_at: '2026-10-04T00:00:00Z',
    closed_at: '2026-10-08T00:00:00Z',
    duration_sec: 86400,
    volume: 5000,
    entry_price: 100,
    exit_price: 90,
    pnl: 200,
    fees: 5,
    funding: 1.5,
    net_pnl: 195,
    fills: 2,
  },
};

function renderFeed(props: Partial<React.ComponentProps<typeof ActivityFeed>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ActivityFeed items={[]} live="disconnected" {...props} />
    </NextIntlClientProvider>,
  );
}

describe('ActivityFeed (SIDEBAR-3EVENTS)', () => {
  it('shows loading skeletons while connecting with no items', () => {
    renderFeed({ live: 'reconnecting' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Waiting for live activity…')).not.toBeInTheDocument();
  });

  it('shows the waiting copy once connected with no items', () => {
    renderFeed({ live: 'connected', connection: 'LIVE' });
    expect(screen.getByText('Waiting for live activity…')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders limit / fill / close rows with correct labels', () => {
    renderFeed({ items: [limitItem, fillItem, closeItem], live: 'connected', connection: 'LIVE' });
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    // limit: LIMIT + side + coin + size + @price
    expect(screen.getByText('LIMIT')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    // fill: Open Long → LONG (not BUY)
    expect(screen.getByText('LONG')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    // close: CLOSED + side + coin + net
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('+$195')).toBeInTheDocument();
  });

  it('falls back to BUY/SELL for spot fills', () => {
    renderFeed({
      items: [
        {
          kind: 'fill',
          time: '2026-10-08T00:01:00Z',
          fill: {
            coin: 'ETH',
            side: 'SELL',
            size: 0.25,
            price: 3000,
            time: '2026-10-08T00:01:00Z',
            tid: 7,
            dir: 'Sell',
          },
        },
      ],
      live: 'connected',
      connection: 'LIVE',
    });
    expect(screen.getByText('SELL')).toBeInTheDocument();
    expect(screen.queryByText('SHORT')).not.toBeInTheDocument();
  });

  it('gates the LIVE badge on the backend connection state', () => {
    const { unmount } = renderFeed({
      items: [fillItem],
      live: 'connected',
      connection: 'RECONNECTING',
    });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    unmount();
    renderFeed({ items: [fillItem], live: 'connected', connection: 'ERROR' });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('shows no LIVE badge while the transport is disconnected', () => {
    renderFeed({ items: [fillItem], live: 'disconnected', connection: 'LIVE' });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('shows LIVE once connected without connection events (legacy)', () => {
    renderFeed({ items: [fillItem], live: 'connected', connection: null });
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('has no Load more or Retry buttons (WS-only sidebar)', () => {
    renderFeed({ items: [fillItem], live: 'connected', connection: 'LIVE' });
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
