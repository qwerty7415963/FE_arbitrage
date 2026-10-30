import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { ApiError } from '@/infrastructure/api-client';

describe('useAuthGate', () => {
  it('returns loading while auth data is loading', () => {
    const { result } = renderHook(() => useAuthGate({ isAuthenticated: false, isLoading: true }));
    expect(result.current).toBe('loading');
  });

  it('returns unauthenticated without a session', () => {
    const { result } = renderHook(() => useAuthGate({ isAuthenticated: false }));
    expect(result.current).toBe('unauthenticated');
  });

  it('returns expired for any 401 ApiError', () => {
    const { result } = renderHook(() =>
      useAuthGate({
        isAuthenticated: true,
        error: new ApiError(401, 'AUTH-003', 'Session expired'),
      }),
    );
    expect(result.current).toBe('expired');
  });

  it('treats AUTH-005 401 as expired too', () => {
    const { result } = renderHook(() =>
      useAuthGate({
        isAuthenticated: true,
        error: new ApiError(401, 'AUTH-005', 'Authentication required'),
      }),
    );
    expect(result.current).toBe('expired');
  });

  it('returns error for non-401 failures', () => {
    const { result } = renderHook(() =>
      useAuthGate({
        isAuthenticated: true,
        error: new ApiError(500, 'INTERNAL', 'boom'),
      }),
    );
    expect(result.current).toBe('error');
  });

  it('returns ready for an authenticated session', () => {
    const { result } = renderHook(() => useAuthGate({ isAuthenticated: true }));
    expect(result.current).toBe('ready');
  });
});
