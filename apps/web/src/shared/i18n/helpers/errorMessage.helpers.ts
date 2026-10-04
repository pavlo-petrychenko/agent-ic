import type { AppError } from '@/shared/api/errors/app.error';
import type { ErrorMessageKey } from '@/shared/i18n/typedefs/errorMessage.typedefs';

export const toErrorMessageKey = (error: AppError): ErrorMessageKey =>
  error.reason === null ? `code.${error.code}` : `reason.${error.reason}`;
