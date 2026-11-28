import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  clearTokens,
  hasTokens,
} from '@/lib/token';

describe('token', () => {
  beforeEach(() => {
    clearTokens();
  });

  describe('getAccessToken', () => {
    it('returns null when no token stored', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns stored access token', () => {
      setAccessToken('test-access-token');
      expect(getAccessToken()).toBe('test-access-token');
    });
  });

  describe('setAccessToken', () => {
    it('stores access token in memory', () => {
      setAccessToken('my-access-token');
      expect(getAccessToken()).toBe('my-access-token');
    });

    it('overwrites existing access token', () => {
      setAccessToken('old-token');
      setAccessToken('new-token');
      expect(getAccessToken()).toBe('new-token');
    });
  });

  describe('getRefreshToken', () => {
    it('returns null (refresh token is cookie-based)', () => {
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('setRefreshToken', () => {
    it('is a no-op', () => {
      setRefreshToken('my-refresh-token');
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('sets access token', () => {
      setTokens('access-123', 'refresh-456');
      expect(getAccessToken()).toBe('access-123');
    });
  });

  describe('clearTokens', () => {
    it('removes access token', () => {
      setTokens('access-123', 'refresh-456');
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });

    it('does not throw when tokens already cleared', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });

  describe('hasTokens', () => {
    it('returns false when no tokens', () => {
      expect(hasTokens()).toBe(false);
    });

    it('returns true when access token exists', () => {
      setAccessToken('access');
      expect(hasTokens()).toBe(true);
    });
  });
});
