import type { ErrorReason } from '@agent-ic/contracts';

import type { ApiFieldError, AppErrorCode, AppErrorOptions } from './api.typedefs';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly reason: ErrorReason | null;
  readonly traceId: string | null;
  readonly fields: readonly ApiFieldError[];

  constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = AppError.name;
    this.code = options.code;
    this.reason = options.reason ?? null;
    this.traceId = options.traceId ?? null;
    this.fields = options.fields ?? [];
  }
}
