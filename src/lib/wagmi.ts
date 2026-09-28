import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, bsc } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { config as appConfig } from '@/config';

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, bsc],
  connectors: [
    injected(),
    // WalletConnect touches indexedDB (via idb-keyval) at setup, which does
    // not exist during SSR prerender. Only instantiate it on the client.
    ...(typeof window !== 'undefined'
      ? [walletConnect({ projectId: appConfig.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
