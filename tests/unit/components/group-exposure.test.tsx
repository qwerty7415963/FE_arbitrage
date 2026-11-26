import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupExposure from '@/app/[locale]/(protected)/groups/[groupId]/_components/group-exposure';
import { getGroupExposure } from '@/services/traders';
import enMessages from '@/messages/en.json';

vi.mock('@/services/traders', () => ({
  getGroupExposure: vi.fn(),
}));

async function renderComp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let tree!: ReturnType<typeof render>;
  await act(async () => {
    tree = render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GroupExposure groupId="g1" period="30D" />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return tree;
}

describe('GroupExposure', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getGroupExposure).mockResolvedValue({
      period: '30D',
      as_of: '2026-01-01T00:00:00Z',
      data_status: 'ready',
      partial: false,
      missing_wallets: 0,
      rows: [
        {
          coin: 'BTC',
          long_ntl: 500,
          short_ntl: 300,
          net_ntl: 200,
          gross_ntl: 800,
          long_wallets: 2,
          short_wallets: 1,
          avg_leverage: 3.5,
        },
      ],
    } as never);
  });

  it('renders exposure rows', async () => {
    await renderComp();
    expect(await screen.findByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('2/1')).toBeInTheDocument();
  });
});
