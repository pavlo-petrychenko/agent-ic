import type { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { ClientErrorCode } from '@/shared/api/constants/clientError.constants';

export type AppErrorCode = ErrorCode | ClientErrorCode;

export interface ApiFieldError {
  readonly path: string;
  readonly reason: ErrorReason;
}

export interface AppErrorOptions {
  readonly code: AppErrorCode;
  readonly reason?: ErrorReason | null;
  readonly traceId?: string | null;
  readonly fields?: readonly ApiFieldError[];
  readonly details?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
}
