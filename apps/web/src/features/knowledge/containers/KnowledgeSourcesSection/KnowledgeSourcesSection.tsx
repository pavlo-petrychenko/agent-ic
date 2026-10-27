import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeSources } from '@/features/knowledge/communication/hooks/useKnowledgeSources';
import { useRetryKnowledgeSource } from '@/features/knowledge/communication/hooks/useRetryKnowledgeSource';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { AddSourceDialog } from '@/features/knowledge/containers/AddSourceDialog';
import { DeleteKnowledgeSourceDialog } from '@/features/knowledge/containers/DeleteKnowledgeSourceDialog';
import type { KnowledgeSourcesSectionProps } from '@/features/knowledge/containers/KnowledgeSourcesSection/KnowledgeSourcesSection.typedefs';
import { useKnowledgeSourceRows } from '@/features/knowledge/containers/KnowledgeSourcesSection/useKnowledgeSourceRows';
import { RenameKnowledgeSourceDialog } from '@/features/knowledge/containers/RenameKnowledgeSourceDialog';
import { isKnowledgeSourceActive } from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { KnowledgeSourcesEmpty } from '@/features/knowledge/view/KnowledgeSourcesEmpty';
import { KnowledgeSourcesTable } from '@/features/knowledge/view/KnowledgeSourcesTable';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function KnowledgeSourcesSection({
  knowledgeBaseId,
  knowledgeBaseName,
  canAddSource,
  canManageSources,
  onCountsChanged,
}: KnowledgeSourcesSectionProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { sources, loading, failed, retry } = useKnowledgeSources(knowledgeBaseId);
  const { retryKnowledgeSource, retryingSourceId } = useRetryKnowledgeSource(knowledgeBaseId);
  const rows = useKnowledgeSourceRows(sources);
  const [adding, setAdding] = useState(false);
  const [renameTarget, setRenameTarget] = useState<KnowledgeSourceRowView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSourceRowView | null>(null);
  const active = sources.some(({ status }) => isKnowledgeSourceActive(status));
  const previousActive = useRef(active);

  useEffect(() => {
    if (previousActive.current && !active) {
      onCountsChanged();
    }
    previousActive.current = active;
  }, [active, onCountsChanged]);

  const onAddSource = canAddSource ? () => setAdding(true) : null;
  const onRenameSource = canManageSources ? setRenameTarget : null;
  const onRetrySource = canManageSources
    ? (source: KnowledgeSourceRowView) => {
        void (async () => {
          try {
            await retryKnowledgeSource(source.id);
            showToast({
              message: t('sources.retry.success', { name: source.title }),
              tone: ToastTone.Ok,
            });
          } catch (failure) {
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
        onAddSource={onAddSource}
        onRenameSource={null}
        onRetrySource={null}
        onDeleteSource={null}
        retryingSourceId={null}
      />
    ) : sources.length === 0 ? (
      loading ? (
        <KnowledgeSourcesTable
          rows={[]}
          loading
          error={null}
          onAddSource={null}
          onRenameSource={null}
          onRetrySource={null}
          onDeleteSource={null}
          retryingSourceId={null}
        />
      ) : (
        <KnowledgeSourcesEmpty onAddSource={onAddSource} />
      )
    ) : (
      <div className="flex flex-col gap-4">
        <KnowledgeSourcesTable
          rows={rows}
          loading={false}
          error={null}
          onAddSource={onAddSource}
          onRenameSource={onRenameSource}
          onRetrySource={onRetrySource}
          onDeleteSource={onDeleteSource}
          retryingSourceId={retryingSourceId}
        />
        <Callout tone={CalloutTone.Neutral}>{t('detail.agentsNote')}</Callout>
      </div>
    );

  return (
    <>
      {content}
      {adding ? (
        <AddSourceDialog
          knowledgeBaseId={knowledgeBaseId}
          knowledgeBaseName={knowledgeBaseName}
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
          onDeleted={() => setDeleteTarget(null)}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </>
  );
}
