import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import viMessages from '@/messages/vi.json';
import { LandingPageView } from '@/app/[locale]/(marketing)/_components/landing-page-view';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}));

describe('LandingPageView', () => {
  it('renders Vietnamese hero, CTAs and FAQ', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <LandingPageView />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Đọc ví trước khi vào lệnh. Bắt spread trước khi nó đóng.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mở Trader Scanner' })).toHaveAttribute(
      'href',
      '/traders',
    );
    expect(screen.getByRole('link', { name: 'Xem Funding Arbitrage' })).toHaveAttribute(
      'href',
      '/funding-arbitrage',
    );
    expect(screen.queryByRole('button', { name: /Kết nối ví|Connect wallet/i })).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'FAQ' })).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu minh họa')).toBeInTheDocument();
  });

  it('renders English hero, CTAs and FAQ', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LandingPageView />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Read the wallet before the trade. Catch the spread before it closes.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Trader Scanner' })).toHaveAttribute(
      'href',
      '/traders',
    );
    expect(screen.getByRole('link', { name: 'View Funding Arbitrage' })).toHaveAttribute(
      'href',
      '/funding-arbitrage',
    );
    expect(screen.queryByRole('button', { name: /Kết nối ví|Connect wallet/i })).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'FAQ' })).toBeInTheDocument();
    expect(screen.getByText('Illustrative data')).toBeInTheDocument();
  });
});
