import type { OpenPosition, PositionSortKey, SortDirection } from '@/types/trader';

function coinCmp(a: OpenPosition, b: OpenPosition): number {
  if (a.coin === b.coin) return 0;
  return a.coin < b.coin ? -1 : 1;
}

function numericValue(p: OpenPosition, sort: PositionSortKey): number | null {
  switch (sort) {
    case 'entry_price':
      return p.entry_price;
    case 'mark_price':
      return p.mark_price;
    case 'position_value':
      return p.position_value;
    case 'unrealized_pnl':
      return p.unrealized_pnl;
    case 'return_on_equity':
      return p.return_on_equity;
    case 'leverage':
      return p.leverage;
    default:
      return null;
  }
}

export function sortPositionsClient(
  positions: OpenPosition[],
  sort: PositionSortKey,
  dir: SortDirection,
): OpenPosition[] {
  const desc = dir === 'desc';
  return [...positions].sort((a, b) => {
    if (sort === 'coin') {
      if (a.coin === b.coin) return 0;
      const cmp = a.coin < b.coin ? -1 : 1;
      return desc ? -cmp : cmp;
    }
    if (sort === 'size') {
      if (a.size !== b.size) {
        const cmp = a.size < b.size ? -1 : 1;
        return desc ? -cmp : cmp;
      }
      return coinCmp(a, b);
    }
    const av = numericValue(a, sort);
    const bv = numericValue(b, sort);
    if (av === null && bv === null) return coinCmp(a, b);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (av === bv) return coinCmp(a, b);
    const cmp = av < bv ? -1 : 1;
    return desc ? -cmp : cmp;
  });
}
