import type { AppError } from '@/shared/api/errors/app.error';
import type { ApiFormErrors } from '@/shared/forms/typedefs/apiFormErrors.typedefs';
import type { ErrorMessageKey } from '@/shared/i18n/typedefs/errorMessage.typedefs';

export function mapApiFieldErrors(
  error: AppError,
  translate: (key: ErrorMessageKey) => string,
): ApiFormErrors {
  const fields: Record<string, string> = {};
  for (const field of error.fields) {
    if (!(field.path in fields)) {
      fields[field.path] = translate(`reason.${field.reason}`);
    }
  }
  return { fields };
}
