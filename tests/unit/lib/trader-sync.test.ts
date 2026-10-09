import { describe, it, expect } from 'vitest';
import {
  SYNC_POLL_INTERVAL_MS,
  SYNC_POLL_MAX_ATTEMPTS,
  getSyncPollInterval,
  normalizeActivityStatus,
  shouldKeepPollingSync,
  shouldTriggerSync,
} from '@/lib/trader-sync';

describe('trader-sync lib (contract v1.1 §4 F1/F2)', () => {
  describe('shouldTriggerSync', () => {
    it('triggers when positions are not ready even with trades present', () => {
      expect(shouldTriggerSync('syncing', true, false, true)).toBe(true);
      expect(shouldTriggerSync('stale', true, false, true)).toBe(true);
      expect(shouldTriggerSync('error', true, false, true)).toBe(true);
    });

    it('triggers when trades are empty even with positions ready', () => {
      expect(shouldTriggerSync('ready', true, true, true)).toBe(true);
    });

    it('does not trigger when positions are ready and trades exist', () => {
      expect(shouldTriggerSync('ready', true, false, true)).toBe(false);
    });

    it('does not trigger before both signals have loaded', () => {
      // Positions still loading, trades empty but not loaded yet.
      expect(shouldTriggerSync(undefined, false, true, false)).toBe(false);
      // Positions loaded+ready, trades still loading.
      expect(shouldTriggerSync('ready', true, false, false)).toBe(false);
    });

    it('does not treat a missing positions snapshot as not-ready', () => {
      expect(shouldTriggerSync(null, false, false, true)).toBe(false);
      expect(shouldTriggerSync(undefined, false, false, true)).toBe(false);
    });
  });

  describe('shouldKeepPollingSync', () => {
    it('keeps polling while syncing under the attempt cap', () => {
      expect(shouldKeepPollingSync('syncing', 1, false)).toBe(true);
      expect(shouldKeepPollingSync('stale', 7, false)).toBe(true);
    });

    it('stops when ready', () => {
      expect(shouldKeepPollingSync('ready', 1, false)).toBe(false);
    });

    it('stops on error', () => {
      expect(shouldKeepPollingSync('syncing', 1, true)).toBe(false);
    });

    it('stops at the attempt cap (~8 attempts)', () => {
      expect(SYNC_POLL_MAX_ATTEMPTS).toBe(8);
      expect(shouldKeepPollingSync('syncing', 7, false)).toBe(true);
      expect(shouldKeepPollingSync('syncing', 8, false)).toBe(false);
      expect(shouldKeepPollingSync('syncing', 99, false)).toBe(false);
    });

    it('does not poll before the first snapshot arrives', () => {
      expect(shouldKeepPollingSync(null, 0, false)).toBe(false);
      expect(shouldKeepPollingSync(undefined, 0, false)).toBe(false);
    });
  });

  describe('getSyncPollInterval', () => {
    it('returns a 10–15s interval while syncing', () => {
      const interval = getSyncPollInterval('syncing', 1, false);
      expect(interval).toBe(SYNC_POLL_INTERVAL_MS);
      expect(SYNC_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(10_000);
      expect(SYNC_POLL_INTERVAL_MS).toBeLessThanOrEqual(15_000);
    });

    it('returns false once ready, errored or capped', () => {
      expect(getSyncPollInterval('ready', 1, false)).toBe(false);
      expect(getSyncPollInterval('syncing', 1, true)).toBe(false);
      expect(getSyncPollInterval('syncing', SYNC_POLL_MAX_ATTEMPTS, false)).toBe(false);
    });
  });

  describe('normalizeActivityStatus', () => {
    it('treats a missing signal (pre-v1.1 payload) as ready', () => {
      expect(normalizeActivityStatus(undefined)).toBe('ready');
      expect(normalizeActivityStatus(null)).toBe('ready');
    });

    it('keeps the contract signal when present', () => {
      expect(normalizeActivityStatus('syncing')).toBe('syncing');
      expect(normalizeActivityStatus('stale')).toBe('stale');
      expect(normalizeActivityStatus('error')).toBe('error');
      expect(normalizeActivityStatus('ready')).toBe('ready');
    });
  });
});
