import { ErrorCode } from '@agent-ic/contracts';
import type { ReasonFieldMap, ServerErrorPlan } from '@/features/auth/typedefs/authForm.typedefs';
import type { AppError } from '@/shared/api/errors/app.error';
import { mapApiFieldErrors } from '@/shared/forms/helpers/apiFieldErrors.helpers';
import type { ErrorMessageKey } from '@/shared/i18n/typedefs/errorMessage.typedefs';

export const planServerErrors = (
  error: AppError,
  translate: (key: ErrorMessageKey) => string,
  reasonFields: ReasonFieldMap,
): ServerErrorPlan => {
  const { fields } = mapApiFieldErrors(error, translate);
  const reasonField = error.reason === null ? undefined : reasonFields[error.reason];
  if (reasonField !== undefined && error.reason !== null) {
    return {
      fields: { ...fields, [reasonField]: translate(`reason.${error.reason}`) },
      formReason: error.reason,
      showFormError: false,
    };
  }
  const hasFields = Object.keys(fields).length > 0 && error.code === ErrorCode.BadUserInput;
  return { fields, formReason: error.reason, showFormError: !hasFields };
};
