import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { knowledgeFailureTranslationKey } from '@/features/knowledge/logic/helpers/knowledgeFailure.helpers';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';

export function useKnowledgeFailureMessage(): (code: string | null) => string | null {
  const { t } = useTranslation(Namespace.Errors);

  return useCallback(
    (code: string | null) => {
      const key = knowledgeFailureTranslationKey(code);
      return key === null ? null : t(key);
    },
    [t],
  );
}
