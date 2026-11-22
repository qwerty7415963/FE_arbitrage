import { config } from '@/config';
import { emitUnauthorized } from '@/lib/auth-events';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from '@/lib/token';
import * as authService from '@/services/auth';

const MSG_SESSION_EXPIRED = 'Session expired';
const MSG_UNKNOWN = 'An error occurred';
const MSG_ABORTED = 'Request aborted';
const MSG_TIMEOUT = 'Request timed out';
const MSG_NETWORK = 'Network error';

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

function getRequestLocale(): string {
  if (typeof document === 'undefined') return 'vi';
  const lang = document.documentElement?.lang;
  if (lang) return lang;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : 'vi';
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  auth?: boolean;
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
  const { timeout = 30000, auth = true, ...fetchOptions } = options;

  const token = getAccessToken();

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept-Language', getRequestLocale());

  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestId = crypto.randomUUID();
  headers.set('X-Request-ID', requestId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const userSignal = fetchOptions.signal;
  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort();
    } else {
      userSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

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
          emitUnauthorized();
          throw new ApiError(401, 'UNAUTHORIZED', MSG_SESSION_EXPIRED, requestId);
        } finally {
          isRefreshing = false;
        }
      }

      if (response.status === 401) {
        emitUnauthorized();
      }

      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.error?.code || 'UNKNOWN_ERROR',
        errorBody.error?.message || MSG_UNKNOWN,
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
      if (userSignal?.aborted) {
        throw new ApiError(499, 'ABORTED', MSG_ABORTED, requestId);
      }
      throw new ApiError(408, 'TIMEOUT', MSG_TIMEOUT, requestId);
    }

    throw new ApiError(500, 'NETWORK_ERROR', MSG_NETWORK, requestId);
  }
}

export async function apiClientNoAuth<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept-Language', getRequestLocale());

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
        errorBody.error?.message || MSG_UNKNOWN,
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
      throw new ApiError(408, 'TIMEOUT', MSG_TIMEOUT, requestId);
    }

    throw new ApiError(500, 'NETWORK_ERROR', MSG_NETWORK, requestId);
  }
}
