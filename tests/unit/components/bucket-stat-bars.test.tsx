import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { BucketStatBars } from '@/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-stat-bars';

describe('BucketStatBars', () => {
  it('shows volume split tooltip', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <BucketStatBars />
      </NextIntlClientProvider>,
    );
    const label = screen.getByText('VOLUME SPLIT (≈)');
    expect(label).toHaveAttribute(
      'title',
      'Estimated from traded volume × long/short order share; not open notional.',
    );
  });
});
