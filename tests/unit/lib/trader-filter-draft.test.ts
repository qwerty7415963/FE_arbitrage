import { describe, it, expect } from 'vitest';
import {
  defaultDraft,
  draftFromQuery,
  draftToQuery,
  updateDraftRange,
} from '@/lib/trader-filter-draft';

describe('trader-filter-draft', () => {
  it('converts a query to editable text and back', () => {
    const draft = draftFromQuery({
      venue: 'hyperliquid',
      period: '7D',
      groupId: 'g1',
      roi: { min: 30 },
      winRate: { min: 60, max: 100 },
      tradeCount: { max: 50 },
    });
    expect(draft.ranges.roi).toEqual({ min: '30', max: '' });
    expect(draft.ranges.winRate).toEqual({ min: '60', max: '100' });
    expect(draft.groupId).toBe('g1');
    expect(draftToQuery(draft)).toEqual({
      venue: 'hyperliquid',
      period: '7D',
      groupId: 'g1',
      roi: { min: 30 },
      winRate: { min: 60, max: 100 },
      tradeCount: { max: 50 },
    });
  });

  it('keeps invalid text as NaN for validation', () => {
    const draft = updateDraftRange(defaultDraft(), 'pnl', 'min', 'abc');
    expect(draftToQuery(draft).pnl?.min).toBeNaN();
  });

  it('updates ranges immutably', () => {
    const before = defaultDraft();
    const after = updateDraftRange(before, 'volume', 'max', '1000');
    expect(before.ranges.volume).toEqual({ min: '', max: '' });
    expect(after.ranges.volume).toEqual({ min: '', max: '1000' });
  });
});
