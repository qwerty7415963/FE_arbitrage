import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import viMessages from '@/messages/vi.json';
import { BucketHeader } from '@/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-header';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: unknown; href: string }) => (
    <a href={href}>{children as never}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}));

function renderHeader(props: Record<string, unknown> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <BucketHeader bucket="profitable" {...props} />
    </NextIntlClientProvider>,
  );
}

describe('BucketHeader', () => {
  it('strips locale prefix from backHref', () => {
    renderHeader({ backHref: '/en/traders/overview' });
    expect(screen.getByRole('link').getAttribute('href')).toBe('/traders/overview');
  });

  it('keeps backHref without locale prefix', () => {
    renderHeader({ backHref: '/traders/overview' });
    expect(screen.getByRole('link').getAttribute('href')).toBe('/traders/overview');
  });

  it('strips vi locale prefix from backHref', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <BucketHeader bucket="profitable" backHref="/vi/traders/overview" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe('/traders/overview');
  });

  it('translates bucket title', () => {
    renderHeader({ bucket: 'profitable' });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Profitable');
  });

  it('humanizes unknown bucket id title', () => {
    renderHeader({ bucket: 'some_new_bucket' });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Some New Bucket');
  });
});
