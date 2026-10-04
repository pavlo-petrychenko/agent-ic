import type { ErrorCode, ErrorReason } from '@agent-ic/contracts';

import type { RuntimeConfig } from '@/shared/config/runtimeConfig.typedefs';

import type { ClientErrorCode } from './api.constants';

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
  readonly cause?: unknown;
}

export interface RequestContextState {
  accessToken: string | null;
  workspaceId: string | null;
}

export interface ApolloClientOptions {
  readonly config: RuntimeConfig;
  readonly onUnauthenticated?: () => Promise<boolean>;
}
