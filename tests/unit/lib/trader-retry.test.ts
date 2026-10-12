import { describe, it, expect } from 'vitest';
import { ApiError } from '@/infrastructure/api-client';
import {
  TRADER_QUERY_MAX_RETRIES,
  shouldRetryTraderQuery,
  traderRetryDelay,
} from '@/lib/trader-retry';

function apiError(status: number): ApiError {
  return new ApiError(status, 'TEST', `status ${status}`);
}

describe('shouldRetryTraderQuery', () => {
  it('retries 429 rate limit', () => {
    expect(shouldRetryTraderQuery(0, apiError(429))).toBe(true);
  });

  it('retries 500 server error', () => {
    expect(shouldRetryTraderQuery(0, apiError(500))).toBe(true);
  });

  it('retries 503 service unavailable', () => {
    expect(shouldRetryTraderQuery(0, apiError(503))).toBe(true);
  });

  it('retries 408 timeout', () => {
    expect(shouldRetryTraderQuery(0, apiError(408))).toBe(true);
  });

  it.each([400, 401, 403, 404, 422, 499])('never retries %i', (status) => {
    expect(shouldRetryTraderQuery(0, apiError(status))).toBe(false);
  });

  it('never retries non-ApiError', () => {
    expect(shouldRetryTraderQuery(0, new Error('No data returned'))).toBe(false);
  });

  it('stops after max retries (failureCount 2 and 3)', () => {
    expect(TRADER_QUERY_MAX_RETRIES).toBe(2);
    expect(shouldRetryTraderQuery(2, apiError(500))).toBe(false);
    expect(shouldRetryTraderQuery(3, apiError(500))).toBe(false);
  });
});

describe('traderRetryDelay', () => {
  it('backs off 1000 then 2000', () => {
    expect(traderRetryDelay(0)).toBe(1000);
    expect(traderRetryDelay(1)).toBe(2000);
  });

  it('caps at 5000', () => {
    expect(traderRetryDelay(3)).toBe(5000);
    expect(traderRetryDelay(10)).toBe(5000);
  });
});
