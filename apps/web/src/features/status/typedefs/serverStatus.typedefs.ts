import type { AppError } from '@/shared/api/AppError';

export interface ServerStatus {
  readonly version: string;
  readonly uptimeSeconds: number;
}

export interface UseServerStatusResult {
  readonly status: ServerStatus | null;
  readonly loading: boolean;
  readonly error: AppError | null;
  readonly retry: () => void;
}
