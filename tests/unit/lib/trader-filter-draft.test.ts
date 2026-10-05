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

describe('parseRaw qua draftToQuery — chuẩn hoá locale', () => {
  it('nhận dấu phẩy làm dấu thập phân', () => {
    const draft = defaultDraft();
    draft.ranges.roi = { min: '0,5', max: '1,25' };
    expect(draftToQuery(draft).roi).toEqual({ min: 0.5, max: 1.25 });
  });

  it('bỏ ký hiệu tiền tệ và phần trăm khi dán', () => {
    const draft = defaultDraft();
    draft.ranges.pnl = { min: '$1,000', max: '2 500' };
    const q = draftToQuery(draft).pnl;
    expect(q?.min).toBe(1000);
    expect(q?.max).toBe(2500);
  });

  it('trả undefined cho ô rỗng', () => {
    const draft = defaultDraft();
    draft.ranges.volume = { min: '   ', max: '' };
    expect(draftToQuery(draft).volume).toBeUndefined();
  });

  it('giữ NaN cho rác thật để tầng validate bắt được', () => {
    const draft = defaultDraft();
    draft.ranges.roi = { min: 'abc', max: '' };
    expect(draftToQuery(draft).roi?.min).toBeNaN();
  });
});

it('mang lastTradeAfter qua draft va nguoc lai', () => {
  const draft = defaultDraft();
  draft.lastTradeAfter = '2026-09-01T00:00:00Z';
  expect(draftToQuery(draft).lastTradeAfter).toBe('2026-09-01T00:00:00Z');

  const back = draftFromQuery({ lastTradeAfter: '2026-09-01T00:00:00Z' });
  expect(back.lastTradeAfter).toBe('2026-09-01T00:00:00Z');
});

it('lastTradeAfter rong thi khong dua vao query', () => {
  const draft = defaultDraft();
  draft.lastTradeAfter = '';
  expect(draftToQuery(draft).lastTradeAfter).toBeUndefined();
});
