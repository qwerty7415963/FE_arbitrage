import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';

const TELEGRAM_BASE = '/api/v1/telegram';

export interface TelegramLinkResponse {
  code: string;
  deep_link: string;
  expires_at: string;
}

export interface TelegramStatus {
  connected: boolean;
  tg_username: string | null;
  locale: string;
  status: string;
  groups_enabled: number;
}

export async function createLink(locale: string): Promise<TelegramLinkResponse> {
  const res = await apiClient<ApiResponse<TelegramLinkResponse>>(`${TELEGRAM_BASE}/link`, {
    method: 'POST',
    body: JSON.stringify({ locale }),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getStatus(): Promise<TelegramStatus> {
  const res = await apiClient<ApiResponse<TelegramStatus>>(`${TELEGRAM_BASE}/status`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function unlink(): Promise<void> {
  await apiClient(`${TELEGRAM_BASE}/link`, { method: 'DELETE' });
}
