import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NO_SERVER_ERRORS } from '@/features/auth/constants/authForm.constants';
import { planServerErrors } from '@/features/auth/logic/helpers/serverErrors.helpers';
import type {
  ReasonFieldMap,
  ServerErrorsState,
  UseServerErrorsResult,
} from '@/features/auth/typedefs/authForm.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function useServerErrors(reasonFields: ReasonFieldMap): UseServerErrorsResult {
  const { t } = useTranslation(Namespace.Errors);
  const errorMessage = useErrorMessage();
  const [state, setState] = useState<ServerErrorsState>(NO_SERVER_ERRORS);

  const report = useCallback(
    (error: unknown) => {
      const appError = toAppError(error);
      const plan = planServerErrors(appError, (key) => t(key), reasonFields);
      setState({
        fieldErrors: plan.fields,
        formError: plan.showFormError ? errorMessage(appError) : null,
        formReason: plan.formReason,
      });
    },
    [t, errorMessage, reasonFields],
  );

  const clearField = useCallback((name: string) => {
    setState((previous) => {
      if (!(name in previous.fieldErrors) && previous.formError === null) {
        return previous;
      }
      const fieldErrors = Object.fromEntries(
        Object.entries(previous.fieldErrors).filter(([field]) => field !== name),
      );
      return { fieldErrors, formError: null, formReason: null };
    });
  }, []);

  return { ...state, report, clearField };
}
