'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { config } from '@/lib/wagmi';
import { onUnauthorized } from '@/lib/auth-events';
import { useAuthStore } from '@/lib/stores/auth';

interface SessionExpiredContextValue {
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
}

const SessionExpiredContext = createContext<SessionExpiredContextValue | null>(null);

export function useSessionExpired(): SessionExpiredContextValue {
  const context = useContext(SessionExpiredContext);
  if (!context) {
    throw new Error('useSessionExpired must be used within Providers');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [sessionExpired, setSessionExpired] = useState(false);
  const initialize = useAuthStore((s) => s.initialize);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    return onUnauthorized(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        authMethod: null,
        connectModalOpen: true,
      });
      setSessionExpired(true);
    });
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const sessionExpiredValue = useMemo(
    () => ({ sessionExpired, dismissSessionExpired }),
    [sessionExpired, dismissSessionExpired],
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SessionExpiredContext.Provider value={sessionExpiredValue}>
          {children}
        </SessionExpiredContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
