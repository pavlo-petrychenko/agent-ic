import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_SCHEDULE_DEFAULT_TIME,
  KnowledgeSourceKind,
  KnowledgeSyncInterval,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSource } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useKnowledgeScheduleLabel(): (source: KnowledgeSource) => string {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return useCallback(
    (source: KnowledgeSource): string => {
      if (source.kind === KnowledgeSourceKind.Upload) {
        return t('sources.sync.oneTime');
      }
      if (source.syncInterval === null) {
        return t('sources.sync.manual');
      }
      switch (source.syncInterval) {
        case KnowledgeSyncInterval.Hourly:
          return t('sources.sync.scheduledHourly');
        case KnowledgeSyncInterval.Daily:
          return t('sources.sync.scheduledDaily', {
            time: source.syncTime ?? KNOWLEDGE_SCHEDULE_DEFAULT_TIME,
          });
        case KnowledgeSyncInterval.Weekly:
          return t('sources.sync.scheduledWeekly');
      }
    },
    [t],
  );
}
