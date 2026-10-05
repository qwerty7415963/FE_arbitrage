import { describe, it, expect } from 'vitest';
import {
  isValidWalletAddress,
  validateDraftFields,
  validateTraderSearch,
} from '@/lib/trader-validation';

describe('validateTraderSearch', () => {
  it('accepts an empty query', () => {
    expect(validateTraderSearch({})).toBeNull();
  });

  it('accepts valid ranges', () => {
    expect(
      validateTraderSearch({
        roi: { min: 30 },
        winRate: { min: 60, max: 100 },
        pnl: { min: -5000, max: 100000 },
        volume: { min: 0 },
        tradeCount: { min: 10, max: 1000 },
        profitFactor: { min: 1.2 },
        longWinRate: { max: 80 },
        shortWinRate: { min: 0, max: 100 },
        lastTradeAfter: '2026-09-01T00:00:00Z',
        limit: 20,
        sortBy: 'pnl',
        sortDirection: 'desc',
        period: '7D',
      }),
    ).toBeNull();
  });

  it('rejects min greater than max per metric', () => {
    expect(validateTraderSearch({ roi: { min: 50, max: 10 } })).toBe('minGreaterThanMax');
    expect(validateTraderSearch({ tradeCount: { min: 5, max: 2 } })).toBe('minGreaterThanMax');
    expect(validateTraderSearch({ shortWinRate: { min: 90, max: 10 } })).toBe('minGreaterThanMax');
  });

  it('rejects NaN values', () => {
    expect(validateTraderSearch({ pnl: { min: Number.NaN } })).toBe('invalidNumber');
  });

  it('rejects out-of-range values but leaves roi/pnl unbounded', () => {
    expect(validateTraderSearch({ winRate: { min: 150 } })).toBe('outOfRange');
    expect(validateTraderSearch({ winRate: { max: -1 } })).toBe('outOfRange');
    expect(validateTraderSearch({ longWinRate: { min: -5 } })).toBe('outOfRange');
    expect(validateTraderSearch({ volume: { min: -1 } })).toBe('outOfRange');
    expect(validateTraderSearch({ profitFactor: { max: -0.5 } })).toBe('outOfRange');
    expect(validateTraderSearch({ pnl: { min: -999999 } })).toBeNull();
    expect(validateTraderSearch({ roi: { max: 9999 } })).toBeNull();
  });

  it('rejects non-integer trade counts', () => {
    expect(validateTraderSearch({ tradeCount: { min: 1.5 } })).toBe('invalidInteger');
    expect(validateTraderSearch({ tradeCount: { max: 10 } })).toBeNull();
  });

  it('validates last_trade_after as a date', () => {
    expect(validateTraderSearch({ lastTradeAfter: 'not-a-date' })).toBe('invalidDateTime');
    expect(validateTraderSearch({ lastTradeAfter: '2026-09-01T00:00:00Z' })).toBeNull();
  });

  it('validates limit bounds', () => {
    expect(validateTraderSearch({ limit: 0 })).toBe('invalidLimit');
    expect(validateTraderSearch({ limit: 101 })).toBe('invalidLimit');
    expect(validateTraderSearch({ limit: 1.5 })).toBe('invalidLimit');
    expect(validateTraderSearch({ limit: 1 })).toBeNull();
    expect(validateTraderSearch({ limit: 100 })).toBeNull();
  });

  it('validates sort and period enums', () => {
    expect(validateTraderSearch({ sortBy: 'avg_position' as never })).toBe('invalidSort');
    expect(validateTraderSearch({ sortDirection: 'sideways' as never })).toBe('invalidSort');
    expect(validateTraderSearch({ period: '90D' as never })).toBe('invalidPeriod');
    expect(validateTraderSearch({ sortBy: 'last_trade', period: 'ALL' })).toBeNull();
  });
});

describe('isValidWalletAddress', () => {
  it('accepts 0x addresses', () => {
    expect(isValidWalletAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    expect(isValidWalletAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(isValidWalletAddress('0x1234')).toBe(false);
    expect(isValidWalletAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false);
    expect(isValidWalletAddress('')).toBe(false);
    expect(isValidWalletAddress(undefined)).toBe(false);
    expect(isValidWalletAddress(null)).toBe(false);
  });
});

describe('validateDraftFields', () => {
  it('chỉ ra đúng ô sai', () => {
    const errors = validateDraftFields({
      venue: 'hyperliquid',
      period: '30D',
      groupId: '',
      lastTradeAfter: '',
      ranges: {
        roi: { min: '10', max: '5' }, // min > max
        winRate: { min: '150', max: '' }, // ngoai 0-100
        tradeCount: { min: '1.5', max: '' }, // phai nguyen
        pnl: { min: 'abc', max: '' }, // khong phai so
        volume: { min: '', max: '' },
        profitFactor: { min: '', max: '' },
        longWinRate: { min: '', max: '' },
        shortWinRate: { min: '', max: '' },
      },
    });
    expect(errors.roi).toBe('minGreaterThanMax');
    expect(errors.winRate).toBe('outOfRange');
    expect(errors.tradeCount).toBe('invalidInteger');
    expect(errors.pnl).toBe('invalidNumber');
    expect(errors.volume).toBeUndefined();
  });

  it('báo invalidDateTime cho lastTradeAfter sai và bỏ qua khi rỗng', () => {
    const bad = validateDraftFields({
      venue: 'hyperliquid',
      period: '30D',
      groupId: '',
      lastTradeAfter: 'not-a-date',
      ranges: {
        roi: { min: '', max: '' },
        winRate: { min: '', max: '' },
        pnl: { min: '', max: '' },
        volume: { min: '', max: '' },
        tradeCount: { min: '', max: '' },
        profitFactor: { min: '', max: '' },
        longWinRate: { min: '', max: '' },
        shortWinRate: { min: '', max: '' },
      },
    });
    expect(bad.lastTradeAfter).toBe('invalidDateTime');

    const ok = validateDraftFields({
      venue: 'hyperliquid',
      period: '30D',
      groupId: '',
      lastTradeAfter: '',
      ranges: {
        roi: { min: '', max: '' },
        winRate: { min: '', max: '' },
        pnl: { min: '', max: '' },
        volume: { min: '', max: '' },
        tradeCount: { min: '', max: '' },
        profitFactor: { min: '', max: '' },
        longWinRate: { min: '', max: '' },
        shortWinRate: { min: '', max: '' },
      },
    });
    expect(ok).toEqual({});
  });
});
