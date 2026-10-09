import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTraderSyncOnView } from '@/hooks/use-trader-sync';
import { triggerTraderSync } from '@/services/traders';

vi.mock('@/services/traders', () => ({
  triggerTraderSync: vi.fn(),
}));

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';
const WALLET_LOWER = WALLET.toLowerCase();

describe('useTraderSyncOnView (contract v1.1 §4 F1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(triggerTraderSync).mockResolvedValue({ status: 'queued' });
  });

  it('POSTs exactly once no matter how often ensureSync is called', async () => {
    const { result } = renderHook(() => useTraderSyncOnView(WALLET));

    let first: unknown;
    let second: unknown;
    await act(async () => {
      first = await result.current.ensureSync();
      second = await result.current.ensureSync();
    });

    expect(vi.mocked(triggerTraderSync)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(triggerTraderSync)).toHaveBeenCalledWith(WALLET_LOWER);
    expect(first).toEqual({ status: 'queued' });
    expect(second).toBeNull();
    expect(result.current.syncStatus).toBe('queued');
  });

  it('does nothing for an empty wallet', async () => {
    const { result } = renderHook(() => useTraderSyncOnView(''));
    let out: unknown = 'pending';
    await act(async () => {
      out = await result.current.ensureSync();
    });
    expect(out).toBeNull();
    expect(triggerTraderSync).not.toHaveBeenCalled();
  });

  it('resets the once-guard when the wallet changes', async () => {
    const { result, rerender } = renderHook(({ wallet }) => useTraderSyncOnView(wallet), {
      initialProps: { wallet: WALLET },
    });

    await act(async () => {
      await result.current.ensureSync();
    });
    expect(triggerTraderSync).toHaveBeenCalledTimes(1);

    rerender({ wallet: '0x1111111111111111111111111111111111111111' });
    await act(async () => {
      await result.current.ensureSync();
    });
    expect(triggerTraderSync).toHaveBeenCalledTimes(2);
  });

  it('syncNow always POSTs (explicit user action bypasses the guard)', async () => {
    const { result } = renderHook(() => useTraderSyncOnView(WALLET));

    await act(async () => {
      await result.current.ensureSync();
      await result.current.syncNow();
      await result.current.syncNow();
    });

    expect(triggerTraderSync).toHaveBeenCalledTimes(3);
  });

  it('surfaces in-flight state and keeps the guard on failure', async () => {
    vi.mocked(triggerTraderSync).mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useTraderSyncOnView(WALLET));

    let out: unknown = 'pending';
    await act(async () => {
      out = await result.current.ensureSync();
    });

    expect(out).toBeNull();
    expect(result.current.isSyncing).toBe(false);
    // No repeat: a failed auto-trigger does not retry by itself.
    await act(async () => {
      await result.current.ensureSync();
    });
    expect(triggerTraderSync).toHaveBeenCalledTimes(1);
  });
});
