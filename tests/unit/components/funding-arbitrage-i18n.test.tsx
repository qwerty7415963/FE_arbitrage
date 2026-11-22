import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import viMessages from '@/messages/vi.json';
import { FundingTable } from '@/app/[locale]/(public)/funding-arbitrage/funding-table';

describe('funding arbitrage i18n', () => {
  it('renders translated empty state in English', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <FundingTable pairs={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('No arbitrage opportunities found')).toBeInTheDocument();
  });

  it('renders translated empty state in Vietnamese', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <FundingTable pairs={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Không tìm thấy cơ hội arbitrage')).toBeInTheDocument();
  });
});
