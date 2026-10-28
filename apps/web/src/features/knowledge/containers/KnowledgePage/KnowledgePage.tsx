import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBases } from '@/features/knowledge/communication/hooks/useKnowledgeBases';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { DeleteKnowledgeBaseDialog } from '@/features/knowledge/containers/DeleteKnowledgeBaseDialog';
import type { KnowledgePageProps } from '@/features/knowledge/containers/KnowledgePage/KnowledgePage.typedefs';
import { KnowledgeSourcesSection } from '@/features/knowledge/containers/KnowledgeSourcesSection';
import { NewKnowledgeBaseDialog } from '@/features/knowledge/containers/NewKnowledgeBaseDialog';
import { knowledgeBasePath } from '@/features/knowledge/logic/helpers/knowledgeRoute.helpers';
import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';
import { KnowledgeEmpty } from '@/features/knowledge/view/KnowledgeEmpty';
import { useActiveWorkspace } from '@/features/workspace';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SecondaryNav } from '@/shared/ui/navigation/SecondaryNav';
import { HeadingElement } from '@/shared/ui/typography/Heading';

export function KnowledgePage({ workspaceId, selectedKnowledgeBaseId }: KnowledgePageProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const navigate = useNavigate();
  const { knowledgeBases, loading, failed, retry } = useKnowledgeBases();
  const active = useActiveWorkspace(workspaceId);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);
  const canCreate =
    active !== null && can(active.role, PermissionResource.KnowledgeBases, PermissionAction.Edit);
  const canDelete =
    active !== null && can(active.role, PermissionResource.KnowledgeBases, PermissionAction.Delete);
  const selected =
    knowledgeBases.find((knowledgeBase) => knowledgeBase.id === selectedKnowledgeBaseId) ??
    knowledgeBases[0] ??
    null;
  const groups =
    knowledgeBases.length === 0
      ? []
      : [
          {
            id: 'knowledge-bases',
            label: null,
            action: null,
            items: knowledgeBases.map((knowledgeBase) => ({
              id: knowledgeBase.id,
              to: knowledgeBasePath(workspaceId, knowledgeBase.id),
              title: knowledgeBase.name,
              subtitle:
                knowledgeBase.documentCount === 0
                  ? t('nav.noSources')
                  : t('nav.sources', { count: knowledgeBase.documentCount }),
              monoTitle: false,
              tile: { icon: IconName.Kb, tone: NodeKind.Kb },
              selected: knowledgeBase.id === selected?.id,
            })),
          },
        ];

  const onCreate = canCreate ? () => setCreating(true) : null;
  const refreshKnowledgeBases = useCallback(() => {
    void retry();
  }, [retry]);
  const onCreated = (knowledgeBaseId: string) => {
    setCreating(false);
    void navigate({
      to: '/w/$workspaceId/knowledge',
      params: { workspaceId },
      search: { kb: knowledgeBaseId },
      replace: true,
    });
  };

  return (
    <div className="flex h-full min-h-0">
      <SecondaryNav
        className="shrink-0"
        title={t('title')}
        ariaLabel={t('nav.label')}
        action={canCreate ? { label: t('nav.new'), onClick: () => setCreating(true) } : null}
        groups={groups}
        emptyMessage={!loading && !failed && knowledgeBases.length === 0 ? t('empty.title') : null}
        headingAs={HeadingElement.H2}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto pb-8">
        <PageHeader
          title={selected?.name ?? t('title')}
          subtitle={
            selected === null ? t('subtitle') : t('detail.subtitle', { count: selected.chunkCount })
          }
          actions={
            selected !== null && canDelete ? (
              <Button variant={ButtonVariant.Danger} onClick={() => setDeleteTarget(selected)}>
                {t('delete.action')}
              </Button>
            ) : null
          }
        />
        <div className="px-7 pt-5">
          {failed ? (
            <Card>
              <EmptyState
                icon={IconName.Alert}
                tone={EmptyStateTone.Err}
                title={t('loadError')}
                actions={
                  <Button variant={ButtonVariant.Secondary} onClick={() => void retry()}>
                    {t('retry')}
                  </Button>
                }
              />
            </Card>
          ) : selected === null ? (
            loading ? null : (
              <KnowledgeEmpty onCreate={onCreate} />
            )
          ) : (
            <KnowledgeSourcesSection
              key={selected.id}
              knowledgeBaseId={selected.id}
              knowledgeBaseName={selected.name}
              canAddSource={canCreate}
              onCountsChanged={refreshKnowledgeBases}
            />
          )}
        </div>
      </div>
      {creating && (
        <NewKnowledgeBaseDialog onClose={() => setCreating(false)} onCreated={onCreated} />
      )}
      {deleteTarget !== null && (
        <DeleteKnowledgeBaseDialog
          workspaceId={workspaceId}
          knowledgeBase={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
