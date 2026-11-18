import { describe, it, expect } from 'vitest';
import { sortPositionsClient } from '@/lib/position-sort';
import type { OpenPosition, PositionSortKey } from '@/types/trader';

function pos(coin: string, overrides: Partial<OpenPosition> = {}): OpenPosition {
  return {
    coin,
    side: 'LONG',
    size: 1,
    entry_price: null,
    mark_price: null,
    position_value: null,
    unrealized_pnl: null,
    return_on_equity: null,
    liquidation_price: null,
    leverage: null,
    max_leverage: null,
    margin_used: null,
    as_of: null,
    ...overrides,
  };
}

const numericFields: PositionSortKey[] = [
  'entry_price',
  'mark_price',
  'position_value',
  'unrealized_pnl',
  'return_on_equity',
  'leverage',
];

describe('sortPositionsClient', () => {
  it('returns new array and does not mutate input (empty)', () => {
    const input: OpenPosition[] = [];
    const out = sortPositionsClient(input, 'coin', 'asc');
    expect(out).toEqual([]);
    expect(out).not.toBe(input);
  });

  it('sorts coin asc/desc', () => {
    const input = [pos('ETH'), pos('BTC'), pos('SOL')];
    const orig = input.map((p) => p.coin);
    const asc = sortPositionsClient(input, 'coin', 'asc');
    expect(asc.map((p) => p.coin)).toEqual(['BTC', 'ETH', 'SOL']);
    const desc = sortPositionsClient(input, 'coin', 'desc');
    expect(desc.map((p) => p.coin)).toEqual(['SOL', 'ETH', 'BTC']);
    expect(input.map((p) => p.coin)).toEqual(orig);
  });

  it('sorts size asc/desc with coin tiebreak', () => {
    const input = [pos('ETH', { size: 2 }), pos('BTC', { size: 2 }), pos('SOL', { size: 1 })];
    expect(sortPositionsClient(input, 'size', 'asc').map((p) => p.coin)).toEqual([
      'SOL',
      'BTC',
      'ETH',
    ]);
    expect(sortPositionsClient(input, 'size', 'desc').map((p) => p.coin)).toEqual([
      'BTC',
      'ETH',
      'SOL',
    ]);
  });

  for (const field of numericFields) {
    it(`sorts ${field} asc/desc with nulls last`, () => {
      const input = [
        pos('B', { [field]: 5 } as Partial<OpenPosition>),
        pos('A', { [field]: null } as Partial<OpenPosition>),
        pos('C', { [field]: 2 } as Partial<OpenPosition>),
      ];
      const asc = sortPositionsClient(input, field, 'asc');
      expect(asc.map((p) => p.coin)).toEqual(['C', 'B', 'A']);
      const desc = sortPositionsClient(input, field, 'desc');
      expect(desc.map((p) => p.coin)).toEqual(['B', 'C', 'A']);
    });

    it(`tiebreaks ${field} equal values by coin asc`, () => {
      const input = [
        pos('B', { [field]: 5 } as Partial<OpenPosition>),
        pos('A', { [field]: 5 } as Partial<OpenPosition>),
      ];
      expect(sortPositionsClient(input, field, 'asc').map((p) => p.coin)).toEqual(['A', 'B']);
      expect(sortPositionsClient(input, field, 'desc').map((p) => p.coin)).toEqual(['A', 'B']);
    });
  }

  it('keeps nulls last regardless of dir for numeric fields', () => {
    const field: PositionSortKey = 'entry_price';
    const input = [pos('Z', { entry_price: null }), pos('A', { entry_price: 1 })];
    expect(sortPositionsClient(input, field, 'desc').map((p) => p.coin)).toEqual(['A', 'Z']);
  });
});
