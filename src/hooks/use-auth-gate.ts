'use client';

import { ApiError } from '@/infrastructure/api-client';

export type AuthGateState = 'loading' | 'unauthenticated' | 'expired' | 'error' | 'ready';

interface AuthGateInput {
  isAuthenticated: boolean;
  isLoading?: boolean;
  error?: unknown;
}

export function useAuthGate({
  isAuthenticated,
  isLoading = false,
  error,
}: AuthGateInput): AuthGateState {
  if (isLoading) return 'loading';
  if (error instanceof ApiError && error.status === 401) return 'expired';
  if (error) return 'error';
  if (!isAuthenticated) return 'unauthenticated';
  return 'ready';
}
