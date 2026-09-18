import { config } from '@/config';

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

async function getAccessToken(): Promise<string | null> {
  // TODO: Implement token retrieval from storage
  return null;
}

async function refreshAccessToken(): Promise<boolean> {
  // TODO: Implement refresh token logic
  return false;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const token = await getAccessToken();

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
      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return apiClient<T>(endpoint, options);
        }
        // TODO: Redirect to login
        throw new ApiError(401, 'UNAUTHORIZED', 'Session expired', requestId);
      }

      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.code || 'UNKNOWN_ERROR',
        errorBody.message || 'An error occurred',
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
