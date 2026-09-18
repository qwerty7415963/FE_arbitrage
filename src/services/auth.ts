import { apiClient, apiClientNoAuth } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  AuthResponse,
  UserResponse,
} from '@/types/auth';
import type {
  WalletNonceRequest,
  WalletVerifyRequest,
  WalletLinkRequest,
  WalletNonce,
  WalletResponse,
} from '@/types/wallet';

const AUTH_BASE = '/api/v1/auth';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClientNoAuth<ApiResponse<AuthResponse>>(`${AUTH_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClientNoAuth<ApiResponse<AuthResponse>>(`${AUTH_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient<ApiResponse<UserResponse>>(`${AUTH_BASE}/me`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const res = await apiClientNoAuth<ApiResponse<AuthResponse>>(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient<ApiResponse<null>>(`${AUTH_BASE}/logout`, {
    method: 'POST',
  });
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient<ApiResponse<null>>(`${AUTH_BASE}/change-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getNonce(data: WalletNonceRequest): Promise<WalletNonce> {
  const res = await apiClientNoAuth<ApiResponse<WalletNonce>>(`${AUTH_BASE}/wallet/nonce`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function verifyWallet(data: WalletVerifyRequest): Promise<AuthResponse> {
  const res = await apiClientNoAuth<ApiResponse<AuthResponse>>(`${AUTH_BASE}/wallet/verify`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getWallets(): Promise<WalletResponse[]> {
  const res = await apiClient<ApiResponse<WalletResponse[]>>(`${AUTH_BASE}/wallet/list`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function linkWallet(data: WalletLinkRequest): Promise<void> {
  await apiClient<ApiResponse<null>>(`${AUTH_BASE}/wallet/link`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unlinkWallet(walletId: string): Promise<void> {
  await apiClient<ApiResponse<null>>(`${AUTH_BASE}/wallet/${walletId}`, {
    method: 'DELETE',
  });
}
