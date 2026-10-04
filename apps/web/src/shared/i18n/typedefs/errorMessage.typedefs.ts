import type { ErrorReason } from '@agent-ic/contracts';
import type { AppErrorCode } from '@/shared/api/typedefs/appError.typedefs';

export type ErrorMessageKey = `reason.${ErrorReason}` | `code.${AppErrorCode}`;
