import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { ScannerBottomBar } from '@/app/[locale]/(protected)/traders/_components/scanner-bottom-bar';

function withIntl(ui: ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('ScannerBottomBar', () => {
  it('renders showing range', () => {
    render(withIntl(<ScannerBottomBar start={1} end={20} total={100} />));
    expect(screen.getByText('Showing 1–20 of 100 results')).toBeInTheDocument();
  });

  it('renders no results when total is 0', () => {
    render(withIntl(<ScannerBottomBar start={0} end={0} total={0} />));
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders pagination slot', () => {
    render(
      withIntl(
        <ScannerBottomBar start={1} end={20} total={100}>
          <button type="button">Next</button>
        </ScannerBottomBar>,
      ),
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
});
