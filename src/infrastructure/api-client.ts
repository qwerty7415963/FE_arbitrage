import { config } from '@/config';
import { emitUnauthorized } from '@/lib/auth-events';
import { getAccessToken, setAccessToken, clearTokens } from '@/lib/token';
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
    public retryAfter?: number,
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
  _retry?: boolean;
}

let refreshPromise: Promise<void> | null = null;

let broadcastChannel: BroadcastChannel | null = null;
if (typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel('auth-token');
    broadcastChannel.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; token?: string } | null;
      if (!data) return;
      if (data.type === 'token' && data.token) {
        setAccessToken(data.token);
      } else if (data.type === 'logout') {
        setAccessToken(null);
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

function broadcastToken(token: string) {
  try {
    broadcastChannel?.postMessage({ type: 'token', token });
  } catch {
    // ignore
  }
}

async function performRefresh(): Promise<void> {
  const data = await authService.refresh();
  setAccessToken(data.access_token);
  broadcastToken(data.access_token);
}

async function doRefresh(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      await navigator.locks.request('auth-refresh', async () => {
        await performRefresh();
      });
    } else {
      await performRefresh();
    }
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function parseRetryAfter(headers: Headers): number | undefined {
  const raw = headers.get('Retry-After');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return seconds;
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return undefined;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 30000, auth = true, _retry, ...fetchOptions } = options;

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
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    if (response.status === 401 && !_retry) {
      try {
        await doRefresh();
      } catch {
        clearTokens();
        emitUnauthorized();
        throw new ApiError(401, 'UNAUTHORIZED', MSG_SESSION_EXPIRED, requestId);
      }
      return apiClient<T>(endpoint, { ...options, _retry: true });
    }

    if (!response.ok) {
      if (response.status === 401) {
        emitUnauthorized();
      }

      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.error?.code || 'UNKNOWN_ERROR',
        errorBody.error?.message || MSG_UNKNOWN,
        requestId,
        parseRetryAfter(response.headers),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { timeout = 30000, _retry, ...fetchOptions } = options;

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
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.error?.code || 'UNKNOWN_ERROR',
        errorBody.error?.message || MSG_UNKNOWN,
        requestId,
        parseRetryAfter(response.headers),
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
