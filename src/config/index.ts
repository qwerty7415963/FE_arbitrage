import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_WS_URL: z.string().url().default('ws://localhost:3001'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Arbitrage'),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().default('71fbf046b37f1cc4359d26fde7228527'),
});

function getEnv() {
  if (typeof window !== 'undefined') {
    // Client-side: only NEXT_PUBLIC_ vars
    return envSchema.parse({
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    });
  }

  // Server-side: all vars
  return envSchema.parse(process.env);
}

export const config = getEnv();
