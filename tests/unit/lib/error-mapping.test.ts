import { describe, it, expect } from 'vitest';
import { mapErrorCode } from '@/lib/error-mapping';

describe('mapErrorCode', () => {
  it('maps common codes to correct keys', () => {
    expect(mapErrorCode('AUTH-004')).toBe('errors.AUTH-004');
    expect(mapErrorCode('GROUP-002')).toBe('errors.GROUP-002');
    expect(mapErrorCode('COMMON-902')).toBe('errors.COMMON-902');
    expect(mapErrorCode('AUTH-001')).toBe('errors.AUTH-001');
    expect(mapErrorCode('NETWORK_ERROR')).toBe('errors.network');
    expect(mapErrorCode('TIMEOUT')).toBe('errors.timeout');
    expect(mapErrorCode('ABORTED')).toBe('errors.aborted');
  });

  it('maps unknown code to errors.unknown', () => {
    expect(mapErrorCode('NOPE-999')).toBe('errors.unknown');
  });

  it('maps null/undefined to errors.unknown', () => {
    expect(mapErrorCode(null)).toBe('errors.unknown');
    expect(mapErrorCode(undefined)).toBe('errors.unknown');
  });
});
