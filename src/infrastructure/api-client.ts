import { config } from '@/config';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from '@/lib/token';
import * as authService from '@/services/auth';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const token = getAccessToken();

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestId = crypto.randomUUID();
  headers.set('X-Request-ID', requestId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${config.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 && getRefreshToken()) {
        if (isRefreshing) {
          return new Promise<T>((resolve, reject) => {
            failedQueue.push({ resolve: resolve as never, reject });
          }).then(() => {
            return apiClient<T>(endpoint, options);
          });
        }

        isRefreshing = true;

        try {
          const refreshToken = getRefreshToken()!;
          const data = await authService.refresh(refreshToken);
          setAccessToken(data.access_token);
          setRefreshToken(data.refresh_token);
          processQueue(null, data.access_token);
          return apiClient<T>(endpoint, options);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          clearTokens();
          throw new ApiError(401, 'UNAUTHORIZED', 'Session expired', requestId);
        } finally {
          isRefreshing = false;
        }
      }

      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.error?.code || 'UNKNOWN_ERROR',
        errorBody.error?.message || 'An error occurred',
        requestId,
      );
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'Request timed out', requestId);
    }

    throw new ApiError(500, 'NETWORK_ERROR', 'Network error', requestId);
  }
}

export async function apiClientNoAuth<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');

  const requestId = crypto.randomUUID();
  headers.set('X-Request-ID', requestId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${config.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.error?.code || 'UNKNOWN_ERROR',
        errorBody.error?.message || 'An error occurred',
        requestId,
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'Request timed out', requestId);
    }

    throw new ApiError(500, 'NETWORK_ERROR', 'Network error', requestId);
  }
}
