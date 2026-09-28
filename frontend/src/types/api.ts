export interface BackendStatus {
  online: boolean;
  timestamp?: string;
  uptime?: number;
  loading: boolean;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}
