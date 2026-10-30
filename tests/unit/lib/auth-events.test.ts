import { describe, it, expect, vi } from 'vitest';
import { emitUnauthorized, onUnauthorized } from '@/lib/auth-events';

describe('auth-events', () => {
  it('notifies subscribed listeners', () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    emitUnauthorized();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    unsubscribe();

    emitUnauthorized();

    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps notifying other listeners when one throws', () => {
    const failing = vi.fn(() => {
      throw new Error('listener boom');
    });
    const healthy = vi.fn();
    const unsubscribeFailing = onUnauthorized(failing);
    const unsubscribeHealthy = onUnauthorized(healthy);

    expect(() => emitUnauthorized()).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);

    unsubscribeFailing();
    unsubscribeHealthy();
  });

  it('supports repeated emits', () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    emitUnauthorized();
    emitUnauthorized();

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
