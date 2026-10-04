import { ErrorCode } from '@agent-ic/contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppError } from '@/shared/api/errors/app.error';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { toErrorMessageKey } from '@/shared/i18n/helpers/errorMessage.helpers';

export function useErrorMessage(): (error: AppError) => string {
  const { t } = useTranslation(Namespace.Errors);

  return useCallback(
    (error) => {
      const message = t(toErrorMessageKey(error));
      if (error.code === ErrorCode.Internal && error.traceId !== null) {
        return `${message} ${t('traceReference', { traceId: error.traceId })}`;
      }
      return message;
    },
    [t],
  );
}
