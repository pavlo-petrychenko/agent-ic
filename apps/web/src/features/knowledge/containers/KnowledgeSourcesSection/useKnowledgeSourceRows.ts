import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import {
  formatKnowledgeSourceDate,
  isKnowledgeSourceActive,
  isKnowledgeSourceRetryable,
} from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import { useKnowledgeFailureSummary } from '@/features/knowledge/logic/hooks/useKnowledgeFailureSummary';
import type {
  KnowledgeSource,
  KnowledgeSourceRowView,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useKnowledgeSourceRows(
  sources: readonly KnowledgeSource[],
): readonly KnowledgeSourceRowView[] {
  const { t, i18n } = useTranslation(KNOWLEDGE_NAMESPACE);
  const failureSummary = useKnowledgeFailureSummary();

  return useMemo(() => {
    const kindLabel = (kind: KnowledgeSourceKind): string => {
      switch (kind) {
        case KnowledgeSourceKind.Upload:
          return t('sources.kind.upload');
        case KnowledgeSourceKind.GoogleDocs:
          return t('sources.kind.googleDocs');
      }
    };

    const statusLabel = (status: KnowledgeSourceStatus): string => {
      switch (status) {
        case KnowledgeSourceStatus.Pending:
          return t('sources.status.queued');
        case KnowledgeSourceStatus.Indexing:
          return t('sources.status.indexing');
        case KnowledgeSourceStatus.Ready:
          return t('sources.status.indexed');
        case KnowledgeSourceStatus.Error:
          return t('sources.status.failed');
      }
    };

    const statusDetail = (source: KnowledgeSource): string | null => {
      switch (source.status) {
        case KnowledgeSourceStatus.Pending:
          return t('sources.status.pendingDetail');
        case KnowledgeSourceStatus.Indexing:
          return t('sources.status.indexingDetail');
        case KnowledgeSourceStatus.Ready:
          return t('sources.chunks', { count: source.chunkCount });
        case KnowledgeSourceStatus.Error:
          return failureSummary(source.lastErrorCode) ?? t('sources.status.errorDetail');
      }
    };

    return sources.map((source) => ({
      id: source.id,
      title: source.title,
      kindLabel: kindLabel(source.kind),
      syncLabel:
        source.kind === KnowledgeSourceKind.Upload
          ? t('sources.sync.oneTime')
          : t('sources.sync.connected'),
      syncDetail: t('sources.sync.added', {
        date: formatKnowledgeSourceDate(source.createdAt, i18n.language),
      }),
      status: source.status,
      isActive: isKnowledgeSourceActive(source.status),
      canRetry: isKnowledgeSourceRetryable(source.status, source.lastErrorCode),
      statusLabel: statusLabel(source.status),
      statusDetail: statusDetail(source),
    }));
  }, [failureSummary, i18n.language, sources, t]);
}
