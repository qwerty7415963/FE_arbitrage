let accessToken: string | null = null;

// Remove legacy localStorage token keys on boot (no tokens in localStorage).
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
  } catch {
    // ignore
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Backward-compatible aliases; refresh token is never stored client-side.
export function getRefreshToken(): string | null {
  return null;
}

export function setRefreshToken(_token: string): void {
  void _token;
  // no-op: refresh token lives in httpOnly cookie
}

export function setTokens(accessTokenValue: string, _refreshToken?: string): void {
  void _refreshToken;
  accessToken = accessTokenValue;
}

export function clearTokens(): void {
  accessToken = null;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function hasTokens(): boolean {
  return !!accessToken;
}

export function hasAccessToken(): boolean {
  return !!accessToken;
}
