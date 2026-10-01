import { describe, it, expect, beforeEach } from 'vitest';
import {
  listSavedSearches,
  removeSavedSearch,
  sanitizeTraderSearchQuery,
  saveSavedSearch,
} from '@/lib/trader-saved-searches';

describe('trader-saved-searches', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('sanitizeTraderSearchQuery', () => {
    it('keeps known keys and drops cursor', () => {
      expect(
        sanitizeTraderSearchQuery({
          period: '7D',
          roi: { min: 30 },
          cursor: 'abc',
          limit: 20,
        }),
      ).toEqual({ period: '7D', roi: { min: 30 }, limit: 20 });
    });
  });

  it('saves, lists and removes searches', () => {
    expect(listSavedSearches()).toEqual([]);
    const entry = saveSavedSearch('My 7D', { period: '7D', roi: { min: 30 } });
    expect(entry?.name).toBe('My 7D');
    expect(listSavedSearches()).toHaveLength(1);
    removeSavedSearch(entry!.id);
    expect(listSavedSearches()).toEqual([]);
  });

  it('rejects empty names and replaces same-name entries', () => {
    expect(saveSavedSearch('   ', { period: '7D' })).toBeNull();
    saveSavedSearch('Dup', { period: '7D' });
    saveSavedSearch('Dup', { period: '30D' });
    const all = listSavedSearches();
    expect(all).toHaveLength(1);
    expect(all[0].query).toEqual({ period: '30D' });
  });

  it('ignores corrupt storage', () => {
    window.localStorage.setItem('trader.saved-searches.v1', 'not-json');
    expect(listSavedSearches()).toEqual([]);
  });
});
