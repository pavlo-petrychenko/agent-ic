import type { ErrorReason } from '@agent-ic/contracts';

import type { AppError } from '@/shared/api/AppError';
import type { AppErrorCode } from '@/shared/api/api.typedefs';

export type ErrorMessageKey = `reason.${ErrorReason}` | `code.${AppErrorCode}`;

export const toErrorMessageKey = (error: AppError): ErrorMessageKey =>
  error.reason === null ? `code.${error.code}` : `reason.${error.reason}`;
