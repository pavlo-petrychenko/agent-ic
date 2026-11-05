import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { knowledgeFailureSummaryKey } from '@/features/knowledge/logic/helpers/knowledgeFailure.helpers';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';

export function useKnowledgeFailureSummary(): (code: string | null) => string | null {
  const { t } = useTranslation(Namespace.Errors);

  return useCallback(
    (code: string | null) => {
      const key = knowledgeFailureSummaryKey(code);
      return key === null ? null : t(key);
    },
    [t],
  );
}
