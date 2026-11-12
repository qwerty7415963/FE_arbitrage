import { describe, it, expect } from 'vitest';
import {
  formatFundingRate,
  formatInterval,
  formatFundingSpread,
  formatApr,
  formatUsd,
  formatPriceSpread,
  resolveLongShort,
} from '@/lib/funding-format';

describe('formatFundingRate', () => {
  it('multiplies by 100 with 4 decimals and falls back for invalid input', () => {
    expect(formatFundingRate('0.00012')).toBe('0.0120%');
    expect(formatFundingRate(null)).toBe('—');
    expect(formatFundingRate(undefined)).toBe('—');
    expect(formatFundingRate('abc')).toBe('—');
  });
});

describe('formatInterval', () => {
  it('maps standard intervals', () => {
    expect(formatInterval(3600)).toBe('1h');
    expect(formatInterval(14400)).toBe('4h');
    expect(formatInterval(28800)).toBe('8h');
    expect(formatInterval(86400)).toBe('24h');
  });
  it('minutes under hour', () => {
    expect(formatInterval(1800)).toBe('30m');
    expect(formatInterval(300)).toBe('5m');
  });
  it('hours otherwise', () => {
    expect(formatInterval(7200)).toBe('2h');
  });
  it('fallback', () => {
    expect(formatInterval(null)).toBe('—');
    expect(formatInterval(undefined)).toBe('—');
  });
});

describe('formatFundingSpread', () => {
  it('signed 4 decimals + %/h', () => {
    expect(formatFundingSpread(10.4886)).toBe('+10.4886%/h');
    expect(formatFundingSpread(-1.5)).toBe('-1.5000%/h');
  });
  it('fallback', () => {
    expect(formatFundingSpread(null)).toBe('—');
    expect(formatFundingSpread(undefined)).toBe('—');
  });
});

describe('formatApr', () => {
  it('examples', () => {
    expect(formatApr(79)).toBe('+79%');
    expect(formatApr(-2)).toBe('-2%');
    expect(formatApr(91900)).toBe('+91.9K%');
    expect(formatApr(1200000)).toBe('+1.2M%');
  });
  it('fallback', () => {
    expect(formatApr(null)).toBe('—');
    expect(formatApr(undefined)).toBe('—');
  });
});

describe('formatUsd', () => {
  it('compact one decimal', () => {
    expect(formatUsd('1000000')).toBe('$1.0M');
    expect(formatUsd('500000')).toBe('$500.0K');
    expect(formatUsd('1200000000')).toBe('$1.2B');
  });
  it('fallback', () => {
    expect(formatUsd(null)).toBe('—');
    expect(formatUsd(undefined)).toBe('—');
    expect(formatUsd('abc')).toBe('—');
  });
});

describe('formatPriceSpread', () => {
  it('2 decimals + %', () => {
    expect(formatPriceSpread(0.01)).toBe('0.01%');
    expect(formatPriceSpread(-5.3)).toBe('-5.30%');
  });
  it('fallback', () => {
    expect(formatPriceSpread(null)).toBe('—');
    expect(formatPriceSpread(undefined)).toBe('—');
  });
});

describe('resolveLongShort', () => {
  it('A when long venue equals A', () => {
    expect(resolveLongShort('v1', 'v1', 'v2')).toBe('A');
  });
  it('B when long venue equals B', () => {
    expect(resolveLongShort('v2', 'v1', 'v2')).toBe('B');
  });
  it('null when any venue id is missing or unknown', () => {
    expect(resolveLongShort(null, 'v1', 'v2')).toBeNull();
    expect(resolveLongShort('v1', null, 'v2')).toBeNull();
    expect(resolveLongShort('v1', 'v1', undefined)).toBeNull();
    expect(resolveLongShort(undefined, undefined, undefined)).toBeNull();
    expect(resolveLongShort('v3', 'v1', 'v2')).toBeNull();
    expect(resolveLongShort(undefined, 'v1', 'v3')).toBeNull();
  });
});
