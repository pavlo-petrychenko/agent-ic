import { ErrorReason } from '@agent-ic/contracts';
import type { AppError } from '@/shared/api/errors/app.error';
import type { ErrorMessageKey } from '@/shared/i18n/typedefs/errorMessage.typedefs';

const GENERIC_REASONS: ReadonlySet<ErrorReason> = new Set([ErrorReason.InvalidRequest]);

export const toErrorMessageKey = (error: AppError): ErrorMessageKey => {
  const fieldReason = error.fields[0]?.reason ?? null;
  if (fieldReason !== null && (error.reason === null || GENERIC_REASONS.has(error.reason))) {
    return `reason.${fieldReason}`;
  }
  return error.reason === null ? `code.${error.code}` : `reason.${error.reason}`;
};
