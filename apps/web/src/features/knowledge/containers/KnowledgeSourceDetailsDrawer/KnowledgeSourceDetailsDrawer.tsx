import { useTranslation } from 'react-i18next';
import { useKnowledgeSourceDetail } from '@/features/knowledge/communication/hooks/useKnowledgeSourceDetail';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { KNOWLEDGE_SOURCE_DETAILS_DRAWER_WIDTH } from '@/features/knowledge/containers/KnowledgeSourceDetailsDrawer/KnowledgeSourceDetailsDrawer.constants';
import type { KnowledgeSourceDetailsDrawerProps } from '@/features/knowledge/containers/KnowledgeSourceDetailsDrawer/KnowledgeSourceDetailsDrawer.typedefs';
import {
  formatKnowledgeSourceDate,
  isKnowledgeSourceRetryable,
} from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import { useKnowledgeFailureMessage } from '@/features/knowledge/logic/hooks/useKnowledgeFailureMessage';
import type {
  KnowledgeSourceDetailView,
  KnowledgeSourceTarget,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { KnowledgeSourceDetails } from '@/features/knowledge/view/KnowledgeSourceDetails';
import { Drawer } from '@/shared/ui/overlays/Drawer';

export function KnowledgeSourceDetailsDrawer({
  sourceId,
  canManage,
  retrying,
  onClose,
  onRename,
  onRetry,
  onDelete,
}: KnowledgeSourceDetailsDrawerProps) {
  const { t, i18n } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { detail, loading, failed, retry } = useKnowledgeSourceDetail(sourceId);
  const failureMessage = useKnowledgeFailureMessage();
  const target: KnowledgeSourceTarget | null =
    detail === null ? null : { id: detail.source.id, title: detail.source.title };
  const detailView: KnowledgeSourceDetailView | null =
    detail === null
      ? null
      : {
          source: detail.source,
          documents: detail.documents.map((document) => ({
            ...document,
            failureMessage: failureMessage(document.errorCode),
          })),
        };
  const canRetry =
    detail !== null &&
    isKnowledgeSourceRetryable(detail.source.status, detail.source.lastErrorCode);
  const addedLabel =
    detail === null
      ? null
      : t('sources.sync.added', {
          date: formatKnowledgeSourceDate(detail.source.createdAt, i18n.language),
        });

  return (
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
        sourceFailureMessage={detail === null ? null : failureMessage(detail.source.lastErrorCode)}
        loading={loading}
        failed={failed}
        retrying={retrying}
        canManage={canManage}
        canRetry={canRetry}
        addedLabel={addedLabel}
        onReload={() => void retry()}
        onClose={onClose}
        onRename={canManage && target !== null ? () => onRename(target) : null}
        onRetry={canManage && canRetry && target !== null ? () => onRetry(target) : null}
        onDelete={canManage && target !== null ? () => onDelete(target) : null}
      />
    </Drawer>
  );
}
