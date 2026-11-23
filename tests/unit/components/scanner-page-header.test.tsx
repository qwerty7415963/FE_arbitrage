import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { ScannerPageHeader } from '@/app/[locale]/(protected)/traders/_components/scanner-page-header';

function withIntl(ui: ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('ScannerPageHeader', () => {
  it('renders title, subtitle and last updated time', () => {
    const date = new Date('2026-01-01T12:34:00');
    render(
      withIntl(
        <ScannerPageHeader
          title="Trader Scanner"
          subtitle="Scan traders"
          lastUpdated={date}
          locale="en"
        />,
      ),
    );
    expect(screen.getByRole('heading', { name: 'Trader Scanner' })).toBeInTheDocument();
    expect(screen.getByText('Scan traders')).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it('falls back when lastUpdated is null', () => {
    render(withIntl(<ScannerPageHeader title="T" lastUpdated={null} />));
    expect(screen.getByText('Last updated —')).toBeInTheDocument();
  });

  it('has data-testid', () => {
    render(withIntl(<ScannerPageHeader title="T" />));
    expect(screen.getByTestId('scanner-page-header')).toBeInTheDocument();
  });
});
