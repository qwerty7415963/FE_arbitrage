import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, bsc } from 'wagmi/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, bsc],
  connectors: [metaMask(), walletConnect({ projectId: '71fbf046b37f1cc4359d26fde7228527' })],
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
