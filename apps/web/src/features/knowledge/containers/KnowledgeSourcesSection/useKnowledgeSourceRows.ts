import { ErrorReason } from '@agent-ic/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import { isGoogleConnectionActive } from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import {
  formatKnowledgeSourceDate,
  isKnowledgeSourceActive,
  isKnowledgeSourceRetryable,
} from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import { useKnowledgeFailureSummary } from '@/features/knowledge/logic/hooks/useKnowledgeFailureSummary';
import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import type {
  KnowledgeSource,
  KnowledgeSourceRowView,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useKnowledgeSourceRows(
  sources: readonly KnowledgeSource[],
  connectionStatuses: ReadonlyMap<string, GoogleConnection['status']> = new Map(),
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

    const connectionActive = (source: KnowledgeSource): boolean => {
      if (source.connectionId === null) {
        return source.kind !== KnowledgeSourceKind.GoogleDocs;
      }
      const status = connectionStatuses.get(source.connectionId);
      return status !== undefined && isGoogleConnectionActive(status);
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
          if (
            source.lastErrorCode === ErrorReason.GoogleReconnectRequired &&
            connectionActive(source)
          ) {
            return t('sources.status.retryNeeded');
          }
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
      canRetry:
        isKnowledgeSourceRetryable(source.status, source.lastErrorCode) && connectionActive(source),
      statusLabel: statusLabel(source.status),
      statusDetail: statusDetail(source),
    }));
  }, [connectionStatuses, failureSummary, i18n.language, sources, t]);
}
