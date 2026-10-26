import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeSources } from '@/features/knowledge/communication/hooks/useKnowledgeSources';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { AddSourceDialog } from '@/features/knowledge/containers/AddSourceDialog';
import type { KnowledgeSourcesSectionProps } from '@/features/knowledge/containers/KnowledgeSourcesSection/KnowledgeSourcesSection.typedefs';
import { useKnowledgeSourceRows } from '@/features/knowledge/containers/KnowledgeSourcesSection/useKnowledgeSourceRows';
import { isKnowledgeSourceActive } from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import { KnowledgeSourcesEmpty } from '@/features/knowledge/view/KnowledgeSourcesEmpty';
import { KnowledgeSourcesTable } from '@/features/knowledge/view/KnowledgeSourcesTable';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';

export function KnowledgeSourcesSection({
  knowledgeBaseId,
  knowledgeBaseName,
  canAddSource,
  onCountsChanged,
}: KnowledgeSourcesSectionProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { sources, loading, failed, retry } = useKnowledgeSources(knowledgeBaseId);
  const rows = useKnowledgeSourceRows(sources);
  const [adding, setAdding] = useState(false);
  const active = sources.some(({ status }) => isKnowledgeSourceActive(status));
  const previousActive = useRef(active);

  useEffect(() => {
    if (previousActive.current && !active) {
      onCountsChanged();
    }
    previousActive.current = active;
  }, [active, onCountsChanged]);

  const onAddSource = canAddSource ? () => setAdding(true) : null;
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
      />
    ) : sources.length === 0 ? (
      loading ? (
        <KnowledgeSourcesTable rows={[]} loading error={null} onAddSource={null} />
      ) : (
        <KnowledgeSourcesEmpty onAddSource={onAddSource} />
      )
    ) : (
      <div className="flex flex-col gap-4">
        <KnowledgeSourcesTable rows={rows} loading={false} error={null} onAddSource={onAddSource} />
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
    </>
  );
}
