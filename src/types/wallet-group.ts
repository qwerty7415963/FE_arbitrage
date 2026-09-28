export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  wallet_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
}

export const GROUP_DUPLICATE_CODE = 'GROUP-002';
