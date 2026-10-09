'use client';

import type { DataStatus, PositionDataStatus } from '@/types/trader';

/**
 * Sync-on-view helpers (contract v1.1 §4 F1/F2).
 *
 * - F1: on detail mount, POST /sync ONCE when positions
 *   `data_status !== 'ready'` OR trades are empty (guarded by a ref
 *   in `useTraderSyncOnView`, never by these pure helpers alone).
 * - F2: poll while `data_status !== 'ready'`: every 10–15s, max ~8
 *   attempts (~2 min), stop on unmount/error/ready.
 */

export const SYNC_POLL_INTERVAL_MS = 12_000;

export const SYNC_POLL_MAX_ATTEMPTS = 8;

export type SyncableStatus = DataStatus | PositionDataStatus;

/**
 * Whether the detail view should trigger a priority sync.
 * A missing positions status means "not loaded yet" → do not trigger;
 * a missing activity signal means a pre-v1.1 payload → treat as `ready`.
 */
export function shouldTriggerSync(
  positionsStatus: PositionDataStatus | null | undefined,
  positionsLoaded: boolean,
  tradesEmpty: boolean,
  tradesLoaded: boolean,
): boolean {
  const positionsNotReady =
    positionsLoaded &&
    positionsStatus !== null &&
    positionsStatus !== undefined &&
    positionsStatus !== 'ready';
  const noTrades = tradesLoaded && tradesEmpty;
  return positionsNotReady || noTrades;
}

/**
 * Whether polling should continue: stop on ready / error / attempt cap.
 * `attempts` counts completed fetch cycles (react-query `dataUpdateCount`).
 */
export function shouldKeepPollingSync(
  status: SyncableStatus | null | undefined,
  attempts: number,
  hasError: boolean,
): boolean {
  if (hasError) return false;
  if (status === 'ready') return false;
  if (status === null || status === undefined) return false;
  if (attempts >= SYNC_POLL_MAX_ATTEMPTS) return false;
  return true;
}

/**
 * react-query `refetchInterval` value for sync polling.
 * Returns the poll interval while the snapshot is still syncing,
 * `false` once ready/error/capped (which also stops on unmount).
 */
export function getSyncPollInterval(
  status: SyncableStatus | null | undefined,
  attempts: number,
  hasError: boolean,
): number | false {
  return shouldKeepPollingSync(status, attempts, hasError) ? SYNC_POLL_INTERVAL_MS : false;
}

/**
 * Normalize the activity sync signal: pre-v1.1 payloads carry no
 * `data_status`, which means the wallet predates the signal → `ready`.
 */
export function normalizeActivityStatus(status: DataStatus | null | undefined): DataStatus {
  return status ?? 'ready';
}
