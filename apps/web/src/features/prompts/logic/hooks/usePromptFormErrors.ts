import { ErrorCode } from '@agent-ic/contracts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { UsePromptFormErrorsResult } from '@/features/prompts/typedefs/prompt.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function usePromptFormErrors(): UsePromptFormErrorsResult {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const errorMessage = useErrorMessage();
  const [fieldErrors, setFieldErrors] = useState<Readonly<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const reportTaken = useCallback(
    (error: unknown, field: string, message: string) => {
      const appError = toAppError(error);
      if (appError.code === ErrorCode.Conflict) {
        setFieldErrors({ [field]: message });
        setFormError(null);
        return;
      }
      setFieldErrors({});
      setFormError(errorMessage(appError));
    },
    [errorMessage],
  );

  const reportName = useCallback(
    (error: unknown) => reportTaken(error, PromptFormField.Name, t('newPrompt.nameTaken')),
    [reportTaken, t],
  );
  const reportFolder = useCallback(
    (error: unknown) => reportTaken(error, PromptFormField.Folder, t('newPrompt.folderTaken')),
    [reportTaken, t],
  );
  const reportMessage = useCallback((message: string) => {
    setFieldErrors({});
    setFormError(message);
  }, []);
  const clearField = useCallback((field: string) => {
    setFormError(null);
    setFieldErrors((current) =>
      field in current
        ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== field))
        : current,
    );
  }, []);

  return { fieldErrors, formError, reportName, reportFolder, reportMessage, clearField };
}
