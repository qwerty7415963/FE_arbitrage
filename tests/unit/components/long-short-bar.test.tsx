import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LongShortBar } from '@/components/shared/traders/long-short-bar';

describe('LongShortBar', () => {
  it('renders 60/40', () => {
    render(<LongShortBar longPct={60} shortPct={40} />);
    expect(screen.getByText('60% / 40%')).toBeInTheDocument();
  });

  it('handles nulls', () => {
    render(<LongShortBar longPct={null} shortPct={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders 100/0', () => {
    render(<LongShortBar longPct={100} shortPct={0} />);
    expect(screen.getByText('100% / 0%')).toBeInTheDocument();
  });

  it('renders 0/100', () => {
    render(<LongShortBar longPct={0} shortPct={100} />);
    expect(screen.getByText('0% / 100%')).toBeInTheDocument();
  });

  it('exposes an a11y label', () => {
    render(<LongShortBar longPct={60} shortPct={40} />);
    expect(screen.getByLabelText('60% / 40%')).toBeInTheDocument();
  });
});
