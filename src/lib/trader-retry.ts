import { ApiError } from '@/infrastructure/api-client';

/**
 * Max automatic retries for trader-data queries (react-query `failureCount`
 * gate). Total attempts = 1 initial + 2 retries.
 */
export const TRADER_QUERY_MAX_RETRIES = 2;

/**
 * Selective retry for trader detail tabs.
 * Retries only transient failures: 429 (rate limit), 408 (timeout),
 * and 5xx (>=500, incl. NETWORK_ERROR mapped to 500).
 * Never retries: 499 (user abort), other 4xx (incl. 401 — refresh-token
 * retry already lives inside apiClient), or non-ApiError (e.g. plain
 * Error("No data returned")).
 */
export function shouldRetryTraderQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= TRADER_QUERY_MAX_RETRIES) return false;
  if (!(error instanceof ApiError)) return false;
  if (error.status === 429 || error.status === 408) return true;
  if (error.status >= 500) return true;
  return false;
}

/**
 * Exponential backoff for trader-data retries: 1000 * 2^attempt,
 * capped at 5000ms (attempt 0 → 1000, 1 → 2000, 2+ → 4000/5000 cap).
 */
export function traderRetryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 5000);
}
