import { describe, it, expect } from 'vitest';
import {
  activitySideTone,
  deriveWinRate,
  formatDateTimeUtc,
  formatDecimal,
  formatDurationSec,
  formatInteger,
  formatNumber,
  formatPercent,
  formatPrice,
  formatRelativeTime,
  formatSignedPct,
  formatSignedPercent,
  formatSignedUsd,
  formatTpSlList,
  formatUsd,
  shortAddress,
} from '@/lib/trader-format';

describe('formatUsd', () => {
  it('formats tiers with sign', () => {
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(999.99)).toBe('$999.99');
    expect(formatUsd(1500)).toBe('$1.50K');
    expect(formatUsd(-2500000)).toBe('-$2.50M');
    expect(formatUsd(2_000_000_000)).toBe('$2.00B');
    expect(formatUsd(-42.5)).toBe('-$42.50');
  });

  it('returns null for missing values', () => {
    expect(formatUsd(null)).toBeNull();
    expect(formatUsd(undefined)).toBeNull();
    expect(formatUsd(Number.NaN)).toBeNull();
  });
});

describe('percent and decimal formatters', () => {
  it('signs ROI percentages', () => {
    expect(formatSignedPercent(12.345)).toBe('+12.35%');
    expect(formatSignedPercent(-5)).toBe('-5.00%');
    expect(formatSignedPercent(0)).toBe('+0.00%');
    expect(formatSignedPercent(null)).toBeNull();
  });

  it('formats plain percentages and decimals', () => {
    expect(formatPercent(68.4)).toBe('68.40%');
    expect(formatDecimal(1.857)).toBe('1.86');
    expect(formatDecimal(null)).toBeNull();
  });

  it('groups integers', () => {
    expect(formatInteger(1234)).toBe('1,234');
    expect(formatInteger(null)).toBeNull();
  });
});

describe('deriveWinRate', () => {
  it('derives percentage from wins and count', () => {
    expect(deriveWinRate(6, 10)).toBe(60);
    expect(deriveWinRate(0, 5)).toBe(0);
  });

  it('returns null when underivable', () => {
    expect(deriveWinRate(1, 0)).toBeNull();
    expect(deriveWinRate(null, 10)).toBeNull();
    expect(deriveWinRate(5, null)).toBeNull();
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-01T12:00:00Z').getTime();

  it('formats buckets', () => {
    expect(formatRelativeTime('2026-10-01T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-10-01T11:55:00Z', now)).toBe('5m ago');
    expect(formatRelativeTime('2026-10-01T09:00:00Z', now)).toBe('3h ago');
    expect(formatRelativeTime('2026-09-29T12:00:00Z', now)).toBe('2d ago');
  });

  it('handles missing, invalid and future input', () => {
    expect(formatRelativeTime(null, now)).toBeNull();
    expect(formatRelativeTime('garbage', now)).toBeNull();
    expect(formatRelativeTime('2026-10-02T12:00:00Z', now)).toBe('just now');
  });
});

describe('formatDateTimeUtc', () => {
  it('formats an exact UTC timestamp', () => {
    expect(formatDateTimeUtc('2026-09-30T12:00:00Z')).toBe('2026-09-30 12:00:00 UTC');
    expect(formatDateTimeUtc(null)).toBeNull();
    expect(formatDateTimeUtc('garbage')).toBeNull();
  });
});

describe('formatSignedUsd', () => {
  it('signs grouped USD values', () => {
    expect(formatSignedUsd(1234)).toBe('+$1,234');
    expect(formatSignedUsd(-567)).toBe('-$567');
    expect(formatSignedUsd(0)).toBe('+$0');
  });

  it('returns a dash for missing values', () => {
    expect(formatSignedUsd(null)).toBe('—');
    expect(formatSignedUsd(undefined)).toBe('—');
    expect(formatSignedUsd(Number.NaN)).toBe('—');
  });
});

describe('formatSignedPct', () => {
  it('signs percentages', () => {
    expect(formatSignedPct(12.345)).toBe('+12.35%');
    expect(formatSignedPct(-5)).toBe('-5.00%');
    expect(formatSignedPct(null)).toBe('—');
  });
});

describe('formatNumber', () => {
  it('groups sizes with configurable digits', () => {
    expect(formatNumber(1234.56789)).toBe('1,234.5679');
    expect(formatNumber(0.5, 2)).toBe('0.5');
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(Number.NaN)).toBe('—');
  });
});

describe('formatTpSlList', () => {
  it('returns dash for empty/null/undefined', () => {
    expect(formatTpSlList([])).toEqual({ text: '—', title: null });
    expect(formatTpSlList(null)).toEqual({ text: '—', title: null });
    expect(formatTpSlList(undefined)).toEqual({ text: '—', title: null });
  });

  it('formats one price', () => {
    expect(formatTpSlList([123.4])).toEqual({ text: '$123.40', title: '$123.40' });
  });

  it('formats two prices', () => {
    expect(formatTpSlList([123.4, 130])).toEqual({
      text: '$123.40 · $130.00',
      title: '$123.40, $130.00',
    });
  });

  it('formats three+ prices with overflow', () => {
    expect(formatTpSlList([123.4, 130, 140])).toEqual({
      text: '$123.40 · $130.00 +1',
      title: '$123.40, $130.00, $140.00',
    });
  });

  it('supports custom max', () => {
    expect(formatTpSlList([1, 2, 3, 4], 1)).toEqual({
      text: '$1.00 +3',
      title: '$1.00, $2.00, $3.00, $4.00',
    });
  });
});

describe('activitySideTone', () => {
  it('maps LONG/BUY to positive and SHORT/SELL to negative', () => {
    expect(activitySideTone('LONG')).toBe('positive');
    expect(activitySideTone('BUY')).toBe('positive');
    expect(activitySideTone('SHORT')).toBe('negative');
    expect(activitySideTone('SELL')).toBe('negative');
  });
});

describe('formatPrice', () => {
  it('returns null for missing', () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice(Number.NaN)).toBeNull();
  });
  it('formats tiers', () => {
    expect(formatPrice(62028)).toBe('$62,028.00');
    expect(formatPrice(500)).toBe('$500.00');
    expect(formatPrice(0.5)).toBe('$0.5000');
    expect(formatPrice(0.001234)).toBe('$0.001234');
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('shortAddress', () => {
  it('shortens long addresses', () => {
    expect(shortAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
  });

  it('passes short strings through', () => {
    expect(shortAddress('0x1234')).toBe('0x1234');
  });
});

describe('formatDurationSec', () => {
  it('renders days and hours for long trades', () => {
    expect(formatDurationSec(216000)).toBe('2d 12h');
  });

  it('renders hours and minutes under a day', () => {
    expect(formatDurationSec(5400)).toBe('1h 30m');
  });

  it('renders minutes and seconds for short spans', () => {
    expect(formatDurationSec(90)).toBe('1m');
    expect(formatDurationSec(45)).toBe('45s');
  });

  it('renders a dash for missing or negative values', () => {
    expect(formatDurationSec(null)).toBe('—');
    expect(formatDurationSec(undefined)).toBe('—');
    expect(formatDurationSec(Number.NaN)).toBe('—');
    expect(formatDurationSec(-5)).toBe('—');
  });
});
