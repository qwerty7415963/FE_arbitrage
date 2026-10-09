'use client';

import { useCallback, useRef, useState } from 'react';
import { triggerTraderSync } from '@/services/traders';
import type { TraderSyncResult, TraderSyncStatus } from '@/types/trader';

export interface UseTraderSyncOnViewResult {
  /** Last sync result (`queued` | `in_flight` | `recent`), null until triggered. */
  syncStatus: TraderSyncStatus | null;
  /** True while a POST /sync request is in flight. */
  isSyncing: boolean;
  /**
   * Auto trigger for detail mount (contract v1.1 §4 F1): POSTs at most
   * ONCE per mounted wallet no matter how often it is called.
   */
  ensureSync: () => Promise<TraderSyncResult | null>;
  /**
   * Manual "Sync now" fallback (contract v1.1 §4 F3): always POSTs,
   * bypassing the once-guard because it is an explicit user action.
   */
  syncNow: () => Promise<TraderSyncResult | null>;
}

export function useTraderSyncOnView(walletAddress: string): UseTraderSyncOnViewResult {
  const wallet = walletAddress.toLowerCase();
  // Synchronous once-guard (ref, touched only in callbacks). It stores
  // the wallet it fired for, so navigating wallets re-arms it with no
  // reset effect and no concurrent double-fire.
  const triggeredRef = useRef<string | null>(null);
  const [syncRecord, setSyncRecord] = useState<{
    wallet: string;
    status: TraderSyncStatus;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const postSync = useCallback(async (): Promise<TraderSyncResult | null> => {
    if (!wallet) return null;
    setIsSyncing(true);
    try {
      const result = await triggerTraderSync(wallet);
      setSyncRecord({ wallet, status: result.status });
      return result;
    } catch {
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [wallet]);

  const ensureSync = useCallback(async (): Promise<TraderSyncResult | null> => {
    if (!wallet || triggeredRef.current === wallet) return null;
    triggeredRef.current = wallet;
    return postSync();
  }, [wallet, postSync]);

  return {
    syncStatus: syncRecord && syncRecord.wallet === wallet ? syncRecord.status : null,
    isSyncing,
    ensureSync,
    syncNow: postSync,
  };
}
