import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MAX_SAVED_SCANS,
  getSavedScansSnapshot,
  listSavedScans,
  removeSavedScan,
  saveSavedScan,
  sanitizeScanQuery,
  subscribeSavedScans,
} from '@/lib/saved-scans';
import type { GroupWalletQuery } from '@/types/wallet-scan';

const STORAGE_KEY = 'perp.saved-scans.v1';

const baseQuery: GroupWalletQuery = {
  timeframe: '7D',
  dex: ['hyperliquid'],
  sort: 'roi',
  order: 'desc',
  filters: [{ metric: 'pnl', operator: 'gt', value: 20000 }],
  page: 3,
  limit: 10,
};

describe('saved-scans', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('sanitizeScanQuery', () => {
    it('strips page and limit but keeps filter fields', () => {
      const result = sanitizeScanQuery(baseQuery);
      expect(result.page).toBeUndefined();
      expect(result.limit).toBeUndefined();
      expect(result.timeframe).toBe('7D');
      expect(result.dex).toEqual(['hyperliquid']);
      expect(result.sort).toBe('roi');
      expect(result.order).toBe('desc');
      expect(result.filters).toEqual(baseQuery.filters);
    });
  });

  describe('listSavedScans', () => {
    it('returns empty array when nothing stored', () => {
      expect(listSavedScans()).toEqual([]);
    });

    it('returns empty array on corrupted JSON', () => {
      window.localStorage.setItem(STORAGE_KEY, '{not json');
      expect(listSavedScans()).toEqual([]);
    });

    it('returns empty array on non-array payload', () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: 1 }));
      expect(listSavedScans()).toEqual([]);
    });

    it('filters out malformed entries', () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          null,
          42,
          { id: 'x' },
          { id: 'y', name: '   ', query: {} },
          { id: 'ok', name: 'Good', query: { timeframe: '30D' } },
        ]),
      );
      const scans = listSavedScans();
      expect(scans).toHaveLength(1);
      expect(scans[0].name).toBe('Good');
    });
  });

  describe('saveSavedScan', () => {
    it('saves a scan with trimmed name and sanitized query', () => {
      const entry = saveSavedScan('  My search  ', baseQuery);
      expect(entry).not.toBeNull();
      expect(entry?.name).toBe('My search');

      const scans = listSavedScans();
      expect(scans).toHaveLength(1);
      expect(scans[0].name).toBe('My search');
      expect(scans[0].query.page).toBeUndefined();
      expect(scans[0].query.timeframe).toBe('7D');
      expect(scans[0].query.filters).toEqual(baseQuery.filters);
    });

    it('rejects blank name and persists nothing', () => {
      expect(saveSavedScan('   ', baseQuery)).toBeNull();
      expect(saveSavedScan('', baseQuery)).toBeNull();
      expect(listSavedScans()).toEqual([]);
    });

    it('upserts by name keeping a single entry', () => {
      saveSavedScan('Same', { timeframe: '24H' });
      saveSavedScan('Same', { timeframe: '90D' });

      const scans = listSavedScans();
      expect(scans).toHaveLength(1);
      expect(scans[0].query.timeframe).toBe('90D');
    });

    it('caps the list at MAX_SAVED_SCANS dropping the oldest', () => {
      for (let i = 0; i < MAX_SAVED_SCANS + 1; i += 1) {
        saveSavedScan(`Scan ${i}`, { timeframe: '30D' });
      }
      const scans = listSavedScans();
      expect(scans).toHaveLength(MAX_SAVED_SCANS);
      expect(scans[0].name).toBe(`Scan ${MAX_SAVED_SCANS}`);
    });
  });

  describe('removeSavedScan', () => {
    it('removes a scan by id', () => {
      const entry = saveSavedScan('Keep me', baseQuery);
      expect(entry).not.toBeNull();
      const remaining = removeSavedScan(entry!.id);
      expect(remaining).toEqual([]);
      expect(listSavedScans()).toEqual([]);
    });

    it('returns unchanged list for unknown id', () => {
      saveSavedScan('Stay', baseQuery);
      const remaining = removeSavedScan('nope');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Stay');
    });
  });

  describe('snapshot subscription', () => {
    it('snapshot reflects stored entries and updates after save', () => {
      expect(getSavedScansSnapshot()).toEqual([]);
      saveSavedScan('Alpha', { timeframe: '30D' });
      const snapshot = getSavedScansSnapshot();
      expect(snapshot).toHaveLength(1);
      expect(snapshot[0].name).toBe('Alpha');
    });

    it('notifies subscribers on save and stops after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeSavedScans(listener);

      saveSavedScan('Alpha', { timeframe: '30D' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      saveSavedScan('Beta', { timeframe: '7D' });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
