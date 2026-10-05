import {
  DEFAULT_TRADER_PERIOD,
  DEFAULT_VENUE,
  type RangeFilter,
  type TraderPeriod,
  type TraderSearchQuery,
} from '@/types/trader';

export const METRIC_DRAFT_KEYS = [
  'roi',
  'winRate',
  'pnl',
  'volume',
  'tradeCount',
  'profitFactor',
  'longWinRate',
  'shortWinRate',
] as const;

export type MetricDraftKey = (typeof METRIC_DRAFT_KEYS)[number];

export interface FilterDraft {
  venue: string;
  period: TraderPeriod;
  groupId: string;
  lastTradeAfter: string; // ISO datetime hoac ''
  ranges: Record<MetricDraftKey, { min: string; max: string }>;
}

function text(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

export function defaultDraft(): FilterDraft {
  const ranges = {} as FilterDraft['ranges'];
  for (const key of METRIC_DRAFT_KEYS) {
    ranges[key] = { min: '', max: '' };
  }
  return {
    venue: DEFAULT_VENUE,
    period: DEFAULT_TRADER_PERIOD,
    groupId: '',
    lastTradeAfter: '',
    ranges,
  };
}

export function draftFromQuery(query: TraderSearchQuery): FilterDraft {
  const draft = defaultDraft();
  if (query.venue) draft.venue = query.venue;
  if (query.period) draft.period = query.period;
  if (query.groupId) draft.groupId = query.groupId;
  if (query.lastTradeAfter) draft.lastTradeAfter = query.lastTradeAfter;
  for (const key of METRIC_DRAFT_KEYS) {
    const range = query[key];
    draft.ranges[key] = { min: text(range?.min), max: text(range?.max) };
  }
  return draft;
}

/**
 * Chuẩn hoá chuỗi người dùng gõ thành số.
 * - Ô rỗng -> undefined (nghĩa là "không lọc theo chiều này").
 * - Chấp nhận dấu phẩy làm dấu thập phân (locale vi).
 * - Bỏ ký hiệu tiền tệ, phần trăm, khoảng trắng, dấu phân cách nghìn.
 * - Giữ nguyên NaN cho rác thật, để validateTraderSearch bắt được.
 */
function parseRaw(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  let normalized = trimmed.replace(/[$€£¥%\s]/g, '');

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) {
    // "1.234,5" (vi) hoac "1,234.5" (en): dau xuat hien sau cung la dau thap phan
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (hasComma) {
    // "1000,5" hoac "1,000" - neu la nhom 3 chu so o cuoi thi coi la phan cach nghin
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(normalized)
      ? normalized.replace(/,/g, '')
      : normalized.replace(',', '.');
  }

  return Number(normalized);
}

export function toRange(raw: { min: string; max: string }): RangeFilter | undefined {
  const min = parseRaw(raw.min);
  const max = parseRaw(raw.max);
  if (min === undefined && max === undefined) return undefined;
  const out: RangeFilter = {};
  if (min !== undefined) out.min = min;
  if (max !== undefined) out.max = max;
  return out;
}

export function draftToQuery(draft: FilterDraft): TraderSearchQuery {
  const query: TraderSearchQuery = {
    venue: draft.venue,
    period: draft.period,
  };
  if (draft.groupId) query.groupId = draft.groupId;
  const lastTrade = draft.lastTradeAfter.trim();
  if (lastTrade) query.lastTradeAfter = lastTrade;
  for (const key of METRIC_DRAFT_KEYS) {
    const range = toRange(draft.ranges[key]);
    if (range) query[key] = range;
  }
  return query;
}

export function updateDraftRange(
  draft: FilterDraft,
  key: MetricDraftKey,
  bound: 'min' | 'max',
  value: string,
): FilterDraft {
  return { ...draft, ranges: { ...draft.ranges, [key]: { ...draft.ranges[key], [bound]: value } } };
}
