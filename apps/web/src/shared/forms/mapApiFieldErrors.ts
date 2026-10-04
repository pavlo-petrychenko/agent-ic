import type { AppError } from '@/shared/api/AppError';
import type { ApiFormErrors } from '@/shared/forms/forms.typedefs';
import type { ErrorMessageKey } from '@/shared/i18n/errorMessage.helpers';

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
