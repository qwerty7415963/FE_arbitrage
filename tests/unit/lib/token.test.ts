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
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('returns null when no token stored', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns stored access token', () => {
      localStorage.setItem('access_token', 'test-access-token');
      expect(getAccessToken()).toBe('test-access-token');
    });
  });

  describe('setAccessToken', () => {
    it('stores access token in localStorage', () => {
      setAccessToken('my-access-token');
      expect(localStorage.getItem('access_token')).toBe('my-access-token');
    });

    it('overwrites existing access token', () => {
      setAccessToken('old-token');
      setAccessToken('new-token');
      expect(localStorage.getItem('access_token')).toBe('new-token');
    });
  });

  describe('getRefreshToken', () => {
    it('returns null when no token stored', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('returns stored refresh token', () => {
      localStorage.setItem('refresh_token', 'test-refresh-token');
      expect(getRefreshToken()).toBe('test-refresh-token');
    });
  });

  describe('setRefreshToken', () => {
    it('stores refresh token in localStorage', () => {
      setRefreshToken('my-refresh-token');
      expect(localStorage.getItem('refresh_token')).toBe('my-refresh-token');
    });
  });

  describe('setTokens', () => {
    it('sets both tokens at once', () => {
      setTokens('access-123', 'refresh-456');
      expect(localStorage.getItem('access_token')).toBe('access-123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-456');
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens', () => {
      setTokens('access-123', 'refresh-456');
      clearTokens();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('does not throw when tokens already cleared', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });

  describe('hasTokens', () => {
    it('returns false when no tokens', () => {
      expect(hasTokens()).toBe(false);
    });

    it('returns false when only access token exists', () => {
      localStorage.setItem('access_token', 'access');
      expect(hasTokens()).toBe(false);
    });

    it('returns false when only refresh token exists', () => {
      localStorage.setItem('refresh_token', 'refresh');
      expect(hasTokens()).toBe(false);
    });

    it('returns true when both tokens exist', () => {
      setTokens('access', 'refresh');
      expect(hasTokens()).toBe(true);
    });
  });
});
