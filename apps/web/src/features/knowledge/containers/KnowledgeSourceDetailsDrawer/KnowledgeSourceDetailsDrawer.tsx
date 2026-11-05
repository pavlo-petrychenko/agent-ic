import { ErrorReason } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeSourceDetail } from '@/features/knowledge/communication/hooks/useKnowledgeSourceDetail';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import { KNOWLEDGE_SOURCE_DETAILS_DRAWER_WIDTH } from '@/features/knowledge/containers/KnowledgeSourceDetailsDrawer/KnowledgeSourceDetailsDrawer.constants';
import type { KnowledgeSourceDetailsDrawerProps } from '@/features/knowledge/containers/KnowledgeSourceDetailsDrawer/KnowledgeSourceDetailsDrawer.typedefs';
import { RemoveSourceDocumentDialog } from '@/features/knowledge/containers/RemoveSourceDocumentDialog';
import { SummaryEditorDialog } from '@/features/knowledge/containers/SummaryEditorDialog';
import { UpdateSourceScheduleDialog } from '@/features/knowledge/containers/UpdateSourceScheduleDialog';
import { isGoogleConnectionActive } from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import {
  canSyncKnowledgeSource,
  formatKnowledgeSourceDate,
  isKnowledgeSourceRetryable,
} from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import { useKnowledgeFailureMessage } from '@/features/knowledge/logic/hooks/useKnowledgeFailureMessage';
import { useKnowledgeScheduleLabel } from '@/features/knowledge/logic/hooks/useKnowledgeScheduleLabel';
import type {
  KnowledgeSourceDetailView,
  KnowledgeSourceDocumentView,
  KnowledgeSourceTarget,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { KnowledgeSourceDetails } from '@/features/knowledge/view/KnowledgeSourceDetails';
import { Drawer } from '@/shared/ui/overlays/Drawer';

export function KnowledgeSourceDetailsDrawer({
  sourceId,
  canManage,
  retrying,
  syncing,
  onClose,
  onSync,
  onRename,
  onRetry,
  onDelete,
  onReconnect,
  reconnecting,
}: KnowledgeSourceDetailsDrawerProps) {
  const { t, i18n } = useTranslation(KNOWLEDGE_NAMESPACE);
  const [summaryTarget, setSummaryTarget] = useState<KnowledgeSourceDocumentView | null>(null);
  const [removeTarget, setRemoveTarget] = useState<KnowledgeSourceDocumentView | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const { detail, loading, failed, retry } = useKnowledgeSourceDetail(sourceId);
  const failureMessage = useKnowledgeFailureMessage();
  const scheduleLabel = useKnowledgeScheduleLabel();
  const target: KnowledgeSourceTarget | null =
    detail === null ? null : { id: detail.source.id, title: detail.source.title };
  const connectionActive =
    detail === null
      ? false
      : detail.connection === null
        ? detail.source.kind !== KnowledgeSourceKind.GoogleDocs
        : isGoogleConnectionActive(detail.connection.status);
  const reconnected =
    detail !== null &&
    connectionActive &&
    detail.source.lastErrorCode === ErrorReason.GoogleReconnectRequired;
  const reconnectedMessage = t('sources.details.reconnected');
  const detailView: KnowledgeSourceDetailView | null =
    detail === null
      ? null
      : {
          source: detail.source,
          documents: detail.documents.map((document) => ({
            ...document,
            failureMessage:
              reconnected && document.errorCode === ErrorReason.GoogleReconnectRequired
                ? reconnectedMessage
                : failureMessage(document.errorCode),
          })),
        };
  const canRetry =
    detail !== null &&
    connectionActive &&
    isKnowledgeSourceRetryable(detail.source.status, detail.source.lastErrorCode);
  const canSync = detail !== null && canSyncKnowledgeSource(detail.source, connectionActive);
  const addedLabel =
    detail === null
      ? null
      : t('sources.sync.added', {
          date: formatKnowledgeSourceDate(detail.source.createdAt, i18n.language),
        });
  const lastSyncedLabel =
    detail === null ||
    detail.source.kind !== KnowledgeSourceKind.GoogleDocs ||
    detail.source.lastSyncAt === null
      ? null
      : detail.source.status === KnowledgeSourceStatus.Error
        ? t('sources.sync.failed', {
            date: formatKnowledgeSourceDate(detail.source.lastSyncAt, i18n.language),
          })
        : t('sources.sync.lastSynced', {
            date: formatKnowledgeSourceDate(detail.source.lastSyncAt, i18n.language),
          });

  return (
    <>
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        ariaLabel={t('sources.details.panelLabel')}
        width={KNOWLEDGE_SOURCE_DETAILS_DRAWER_WIDTH}
        top={0}
        scrim
      >
        <KnowledgeSourceDetails
          detail={detailView}
          sourceFailureMessage={
            detail === null
              ? null
              : reconnected
                ? reconnectedMessage
                : failureMessage(detail.source.lastErrorCode)
          }
          connection={detail === null ? null : detail.connection}
          reconnecting={reconnecting}
          onReconnect={onReconnect}
          loading={loading}
          failed={failed}
          retrying={retrying}
          syncing={syncing}
          canManage={canManage}
          canRetry={canRetry}
          canSync={canSync}
          addedLabel={addedLabel}
          lastSyncedLabel={lastSyncedLabel}
          scheduleLabel={
            detail !== null && detail.source.kind === KnowledgeSourceKind.GoogleDocs
              ? scheduleLabel(detail.source)
              : null
          }
          onReload={() => void retry()}
          onClose={onClose}
          onSync={canManage && canSync && target !== null ? () => onSync?.(target) : null}
          onRename={canManage && target !== null ? () => onRename(target) : null}
          onEditSchedule={
            canManage && detail !== null && detail.source.kind === KnowledgeSourceKind.GoogleDocs
              ? () => setEditingSchedule(true)
              : null
          }
          onRetry={canManage && canRetry && target !== null ? () => onRetry(target) : null}
          onDelete={canManage && target !== null ? () => onDelete(target) : null}
          onEditSummary={
            canManage &&
            detail !== null &&
            detail.source.kind === KnowledgeSourceKind.GoogleDocs &&
            detail.source.status !== KnowledgeSourceStatus.Pending &&
            detail.source.status !== KnowledgeSourceStatus.Indexing
              ? (document) => setSummaryTarget(document)
              : null
          }
          onRemoveDocument={canManage ? (document) => setRemoveTarget(document) : null}
        />
      </Drawer>
      {summaryTarget !== null && detail !== null ? (
        <SummaryEditorDialog
          sourceId={detail.source.id}
          document={summaryTarget}
          onClose={() => setSummaryTarget(null)}
        />
      ) : null}
      {removeTarget !== null && detail !== null ? (
        <RemoveSourceDocumentDialog
          knowledgeBaseId={detail.source.knowledgeBaseId}
          sourceId={detail.source.id}
          sourceName={detail.source.title}
          document={removeTarget}
          onRemoved={() => setRemoveTarget(null)}
          onClose={() => setRemoveTarget(null)}
        />
      ) : null}
      {editingSchedule && detail !== null ? (
        <UpdateSourceScheduleDialog
          knowledgeBaseId={detail.source.knowledgeBaseId}
          source={detail.source}
          onClose={() => setEditingSchedule(false)}
        />
      ) : null}
    </>
  );
}
