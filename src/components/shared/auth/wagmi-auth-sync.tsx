'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/lib/stores/auth';

export function WagmiAuthSync() {
  const { address, chainId } = useAccount();

  useEffect(() => {
    if (!address) return;

    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.address !== address) {
      useAuthStore.setState({ address, chainId: chainId ?? null });
    }
  }, [address, chainId]);

  return null;
}
