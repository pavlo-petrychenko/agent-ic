import { ErrorCode } from '@agent-ic/contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppError } from '@/shared/api/AppError';
import { toErrorMessageKey } from '@/shared/i18n/errorMessage.helpers';
import { Namespace } from '@/shared/i18n/i18n.constants';

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
