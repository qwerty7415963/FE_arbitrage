export interface WalletNonceRequest {
  address: string;
  chain_id: number;
}

export interface WalletVerifyRequest {
  message: string;
  signature: string;
}

export interface WalletLinkRequest {
  address: string;
  chain_id: number;
  message: string;
  signature: string;
}

export interface WalletNonce {
  id: string;
  address: string;
  chain_id: number;
  nonce: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

export interface WalletResponse {
  id: string;
  address: string;
  chain_id: number;
  is_primary: boolean;
  verified_at: string;
}
