import { ErrorReason } from '@agent-ic/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeConnections } from '@/features/knowledge/communication/hooks/useKnowledgeConnections';
import { useKnowledgeSources } from '@/features/knowledge/communication/hooks/useKnowledgeSources';
import { useRetryKnowledgeSource } from '@/features/knowledge/communication/hooks/useRetryKnowledgeSource';
import { useSyncKnowledgeSource } from '@/features/knowledge/communication/hooks/useSyncKnowledgeSource';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { AddSourceDialog } from '@/features/knowledge/containers/AddSourceDialog';
import { DeleteKnowledgeSourceDialog } from '@/features/knowledge/containers/DeleteKnowledgeSourceDialog';
import { KnowledgeSourceDetailsDrawer } from '@/features/knowledge/containers/KnowledgeSourceDetailsDrawer';
import type { KnowledgeSourcesSectionProps } from '@/features/knowledge/containers/KnowledgeSourcesSection/KnowledgeSourcesSection.typedefs';
import { useGoogleReconnect } from '@/features/knowledge/containers/KnowledgeSourcesSection/useGoogleReconnect';
import { useKnowledgeSourceActionResults } from '@/features/knowledge/containers/KnowledgeSourcesSection/useKnowledgeSourceActionResults';
import { useKnowledgeSourceRows } from '@/features/knowledge/containers/KnowledgeSourcesSection/useKnowledgeSourceRows';
import { RenameKnowledgeSourceDialog } from '@/features/knowledge/containers/RenameKnowledgeSourceDialog';
import { isGoogleConnectionActive } from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import { isKnowledgeSourceActive } from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import { useKnowledgeFailureMessage } from '@/features/knowledge/logic/hooks/useKnowledgeFailureMessage';
import type {
  KnowledgeSourceActionResult,
  KnowledgeSourceTarget,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { GoogleConnectionBanner } from '@/features/knowledge/view/GoogleConnectionBanner';
import { KnowledgeSourcesEmpty } from '@/features/knowledge/view/KnowledgeSourcesEmpty';
import { KnowledgeSourcesTable } from '@/features/knowledge/view/KnowledgeSourcesTable';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function KnowledgeSourcesSection({
  workspaceId,
  knowledgeBaseId,
  knowledgeBaseName,
  initialAddSource,
  canAddSource,
  canManageSources,
  onCountsChanged,
}: KnowledgeSourcesSectionProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const failureMessage = useKnowledgeFailureMessage();
  const { sources, loading, failed, retry } = useKnowledgeSources(knowledgeBaseId);
  const { retryKnowledgeSource, retryingSourceId } = useRetryKnowledgeSource(knowledgeBaseId);
  const { syncKnowledgeSource, syncingSourceId } = useSyncKnowledgeSource(knowledgeBaseId);
  const { connections, retry: retryConnections } = useKnowledgeConnections(canManageSources);
  const { reconnect, starting: reconnecting } = useGoogleReconnect(workspaceId, knowledgeBaseId);
  const connectionStatuses = useMemo(
    () => new Map(connections.map((connection) => [connection.id, connection.status])),
    [connections],
  );
  const reconnectableConnections = useMemo(
    () => connections.filter((connection) => !isGoogleConnectionActive(connection.status)),
    [connections],
  );
  const rows = useKnowledgeSourceRows(sources, connectionStatuses);
  const [adding, setAdding] = useState(initialAddSource !== null);
  const [detailsSourceId, setDetailsSourceId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<KnowledgeSourceTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSourceTarget | null>(null);
  const active = sources.some(({ status }) => isKnowledgeSourceActive(status));
  const reconnectFailure = sources.some(
    (source) => source.lastErrorCode === ErrorReason.GoogleReconnectRequired,
  );
  const previousActive = useRef(active);
  const refreshedReconnect = useRef(false);

  useEffect(() => {
    if (previousActive.current && !active) {
      onCountsChanged();
    }
    previousActive.current = active;
  }, [active, onCountsChanged]);

  useEffect(() => {
    if (!canManageSources) {
      return;
    }
    if (!reconnectFailure) {
      refreshedReconnect.current = false;
      return;
    }
    if (refreshedReconnect.current) {
      return;
    }
    refreshedReconnect.current = true;
    void retryConnections();
  }, [canManageSources, reconnectFailure, retryConnections]);

  const onActionResult = useCallback(
    ({ action, source, succeeded }: KnowledgeSourceActionResult) => {
      const reason = failureMessage(source.lastErrorCode) ?? t('sources.status.errorDetail');
      const staleCount = source.staleDocumentCount;
      let message: string;
      let tone: ToastTone;
      if (!succeeded) {
        message =
          action === 'sync'
            ? t('sources.sync.resultFailed', { name: source.title, reason })
            : t('sources.retry.resultFailed', { name: source.title, reason });
        tone = ToastTone.Err;
      } else if (staleCount > 0) {
        message =
          action === 'sync'
            ? t('sources.sync.finishedStale', { name: source.title, count: staleCount })
            : t('sources.retry.finishedStale', { name: source.title, count: staleCount });
        tone = ToastTone.Info;
      } else {
        message =
          action === 'sync'
            ? t('sources.sync.finished', { name: source.title })
            : t('sources.retry.finished', { name: source.title });
        tone = ToastTone.Ok;
      }
      showToast({ message, tone });
    },
    [failureMessage, showToast, t],
  );
  const trackAction = useKnowledgeSourceActionResults(sources, onActionResult);
  const onAddSource = canAddSource ? () => setAdding(true) : null;
  const onOpenSource = (source: KnowledgeSourceTarget) => setDetailsSourceId(source.id);
  const onRenameSource = canManageSources ? setRenameTarget : null;
  const onSyncSource = canManageSources
    ? (source: KnowledgeSourceTarget) => {
        const cancel = trackAction(source, 'sync');
        void (async () => {
          try {
            await syncKnowledgeSource(source.id);
            showToast({
              message: t('sources.sync.started', { name: source.title }),
              tone: ToastTone.Ok,
            });
          } catch (failure) {
            cancel();
            showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
          }
        })();
      }
    : null;
  const onRetrySource = canManageSources
    ? (source: KnowledgeSourceTarget) => {
        const cancel = trackAction(source, 'retry');
        void (async () => {
          try {
            await retryKnowledgeSource(source.id);
            showToast({
              message: t('sources.retry.success', { name: source.title }),
              tone: ToastTone.Ok,
            });
          } catch (failure) {
            cancel();
            showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
          }
        })();
      }
    : null;
  const onDeleteSource = canManageSources ? setDeleteTarget : null;
  const refreshSources = useCallback(() => {
    void retry();
  }, [retry]);

  const content =
    failed && sources.length === 0 ? (
      <KnowledgeSourcesTable
        rows={[]}
        loading={false}
        error={{
          message: t('sources.loadError'),
          retryLabel: t('retry'),
          onRetry: refreshSources,
        }}
        currentSourceId={null}
        onAddSource={onAddSource}
        onOpenSource={null}
        onSyncSource={null}
        onRenameSource={null}
        onRetrySource={null}
        onDeleteSource={null}
        retryingSourceId={null}
        syncingSourceId={null}
      />
    ) : sources.length === 0 ? (
      loading ? (
        <KnowledgeSourcesTable
          rows={[]}
          loading
          error={null}
          currentSourceId={null}
          onAddSource={null}
          onOpenSource={null}
          onSyncSource={null}
          onRenameSource={null}
          onRetrySource={null}
          onDeleteSource={null}
          retryingSourceId={null}
          syncingSourceId={null}
        />
      ) : (
        <KnowledgeSourcesEmpty onAddSource={onAddSource} />
      )
    ) : (
      <div className="flex flex-col gap-4">
        {canManageSources ? (
          <GoogleConnectionBanner
            connections={reconnectableConnections}
            reconnecting={reconnecting}
            onReconnect={() => void reconnect()}
          />
        ) : null}
        <KnowledgeSourcesTable
          rows={rows}
          loading={false}
          error={null}
          currentSourceId={detailsSourceId}
          onAddSource={onAddSource}
          onOpenSource={onOpenSource}
          onSyncSource={onSyncSource}
          onRenameSource={onRenameSource}
          onRetrySource={onRetrySource}
          onDeleteSource={onDeleteSource}
          retryingSourceId={retryingSourceId}
          syncingSourceId={syncingSourceId}
        />
      </div>
    );

  return (
    <>
      {content}
      {adding ? (
        <AddSourceDialog
          workspaceId={workspaceId}
          knowledgeBaseId={knowledgeBaseId}
          knowledgeBaseName={knowledgeBaseName}
          initialSourceType={initialAddSource ?? undefined}
          onUploaded={refreshSources}
          onClose={() => setAdding(false)}
        />
      ) : null}
      {renameTarget !== null ? (
        <RenameKnowledgeSourceDialog
          knowledgeBaseId={knowledgeBaseId}
          source={renameTarget}
          onClose={() => setRenameTarget(null)}
        />
      ) : null}
      {deleteTarget !== null ? (
        <DeleteKnowledgeSourceDialog
          knowledgeBaseId={knowledgeBaseId}
          source={deleteTarget}
          onDeleted={() => {
            if (deleteTarget.id === detailsSourceId) {
              setDetailsSourceId(null);
            }
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
      {detailsSourceId !== null ? (
        <KnowledgeSourceDetailsDrawer
          sourceId={detailsSourceId}
          canManage={canManageSources}
          retrying={retryingSourceId === detailsSourceId}
          syncing={syncingSourceId === detailsSourceId}
          onClose={() => setDetailsSourceId(null)}
          onSync={onSyncSource}
          onRename={setRenameTarget}
          onRetry={(source) => onRetrySource?.(source)}
          onDelete={setDeleteTarget}
          onReconnect={canManageSources ? () => void reconnect() : null}
          reconnecting={reconnecting}
        />
      ) : null}
    </>
  );
}
