import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { BucketTables } from '@/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-tables';
import type { BucketWalletRow } from '@/types/trader';
import { useBucketWallets } from '@/hooks/use-bucket-wallets';
import { useBucketMarkets } from '@/hooks/use-bucket-markets';

const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@/hooks/use-bucket-wallets', () => ({ useBucketWallets: vi.fn() }));
vi.mock('@/hooks/use-bucket-markets', () => ({ useBucketMarkets: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: unknown; href: string }) => (
    <a href={href}>{children as never}</a>
  ),
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

function makeRow(overrides: Partial<BucketWalletRow> = {}): BucketWalletRow {
  return {
    address: '0x1111111111111111111111111111111111111111',
    display_name: 'Trader One',
    perp_equity: 1000,
    position_value: 500,
    leverage: 2,
    win_rate: 44.49,
    volume_range: 10000,
    realized_pnl: 100,
    sum_upnl: 200,
    bias: 'bullish',
    cohort: 'medium',
    ...overrides,
  };
}

function renderTables(row: BucketWalletRow) {
  vi.mocked(useBucketWallets).mockReturnValue({
    data: { data: [row], meta: { page: 1, total: 1, total_pages: 1, limit: 20, has_more: false } },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as never);
  vi.mocked(useBucketMarkets).mockReturnValue({
    data: { data: [], meta: { page: 1, total: 0, total_pages: 1, limit: 20, has_more: false } },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as never);
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <BucketTables kind="pnl" bucket="profitable" />
    </NextIntlClientProvider>,
  );
}

describe('BucketTables', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('formats win_rate without multiplying by 100', () => {
    renderTables(makeRow({ win_rate: 44.49 }));
    expect(screen.getByText('44.5%')).toBeInTheDocument();
    expect(screen.queryByText('4449.0%')).not.toBeInTheDocument();
  });

  it('shows dash for null win_rate', () => {
    renderTables(makeRow({ win_rate: null }));
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows dash for null volume and realized_pnl', () => {
    renderTables(makeRow({ volume_range: null, realized_pnl: null }));
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows dash for null position_value and sum_upnl', () => {
    renderTables(makeRow({ position_value: null, sum_upnl: null }));
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('uses Volume (range) header', () => {
    renderTables(makeRow());
    expect(screen.getByText('Volume (range)')).toBeInTheDocument();
  });

  it('navigates to wallet detail on row click', async () => {
    const user = userEvent.setup();
    renderTables(makeRow());
    nav.push.mockClear();
    const row = screen.getByRole('row', { name: /View wallet/ });
    await user.click(row);
    expect(nav.push).toHaveBeenCalledWith('/traders/0x1111111111111111111111111111111111111111');
  });

  it('navigates to wallet detail on Enter key', async () => {
    const user = userEvent.setup();
    renderTables(makeRow());
    nav.push.mockClear();
    const row = screen.getByRole('row', { name: /View wallet/ });
    row.focus();
    await user.keyboard('{Enter}');
    expect(nav.push).toHaveBeenCalledWith('/traders/0x1111111111111111111111111111111111111111');
  });

  it('has aria-label on wallet row', () => {
    renderTables(makeRow());
    const row = screen.getByRole('row', { name: /View wallet/ });
    expect(row).toHaveAttribute('aria-label');
  });
});
