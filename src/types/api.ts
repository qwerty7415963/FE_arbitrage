export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta?: Meta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  request_id?: string;
  details?: unknown;
}

export interface Meta {
  cursor?: string;
  has_more?: boolean;
  limit?: number;
}
