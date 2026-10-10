'use client';

/** Polling interval for mounted trader-data queries (FE-only, no BE change). */
export const TRADER_DATA_REFETCH_INTERVAL_MS = 30_000;

/**
 * Shared `refetchInterval` for trader-data hooks.
 * Polls every 30s while mounted; stops on query error (manual retry only).
 * Disabled queries (`enabled: false`) never start a timer; background tabs
 * pause automatically (`refetchIntervalInBackground` defaults to false);
 * unmount/tab-switch clears the timer (react-query default). `staleTime`
 * is left untouched per hook.
 */
export function traderDataRefetchInterval(query: { state: { status: string } }): number | false {
  return query.state.status === 'error' ? false : TRADER_DATA_REFETCH_INTERVAL_MS;
}
