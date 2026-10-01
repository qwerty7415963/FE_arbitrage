import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletTable } from '@/components/shared/wallets/wallet-table';
import type { GroupWallet } from '@/types/wallet-scan';

const createWallet = (overrides: Partial<GroupWallet> = {}): GroupWallet => ({
  id: 'w1',
  chain: 'evm',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  dex: 'hyperliquid',
  tag: 'main',
  first_seen_at: '2024-01-01T00:00:00Z',
  last_seen_at: '2024-01-02T00:00:00Z',
  added_at: '2024-01-03T00:00:00Z',
  metrics: {
    realized_pnl: 123.456,
    roi: 12.5,
    volume: 1000000,
    avg_position: 5000,
    avg_leverage: 3,
    win_rate: 66.66,
    trade_count: 42,
    long_count: 28,
    short_count: 14,
    computed_at: '2024-01-02T00:00:00Z',
    last_active_at: '2024-01-02T00:00:00Z',
  },
  ...overrides,
});

describe('WalletTable', () => {
  it('renders empty state when no wallets', () => {
    render(<WalletTable wallets={[]} />);
    expect(screen.getByText('No wallets found')).toBeInTheDocument();
  });

  it('renders empty state when wallets is undefined', () => {
    render(<WalletTable wallets={undefined} />);
    expect(screen.getByText('No wallets found')).toBeInTheDocument();
  });

  it('renders wallet row with truncated address', () => {
    const { container } = render(<WalletTable wallets={[createWallet()]} />);
    expect(container.textContent).toContain('0x1234...5678');
    expect(container.querySelector('tbody tr')).toBeInTheDocument();
  });

  it('renders N/A for null metrics', () => {
    const { container } = render(<WalletTable wallets={[createWallet({ metrics: null })]} />);
    expect(container.textContent).toContain('N/A');
  });

  it('renders N/A for null dex and tag', () => {
    render(<WalletTable wallets={[createWallet({ dex: null, tag: null })]} />);
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('colors positive PnL primary and negative destructive', () => {
    const { container, rerender } = render(
      <WalletTable
        wallets={[createWallet({ metrics: { ...createWallet().metrics!, realized_pnl: 10 } })]}
      />,
    );
    expect(container.querySelector('tbody tr td:nth-child(5)')?.className).toContain(
      'text-primary',
    );
    rerender(
      <WalletTable
        wallets={[createWallet({ metrics: { ...createWallet().metrics!, realized_pnl: -10 } })]}
      />,
    );
    expect(container.querySelector('tbody tr td:nth-child(5)')?.className).toContain(
      'text-destructive',
    );
  });
});
