export interface RefreshRequest {
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}
