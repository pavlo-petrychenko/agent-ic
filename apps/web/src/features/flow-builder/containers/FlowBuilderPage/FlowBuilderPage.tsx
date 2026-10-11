import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFlowBuilderDraft } from '@/features/flow-builder/communication/hooks/useFlowBuilderDraft';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { FlowBuilderPageProps } from '@/features/flow-builder/containers/FlowBuilderPage/FlowBuilderPage.typedefs';
import { FlowEditor } from '@/features/flow-builder/containers/FlowEditor';
import { StepPalettePanel } from '@/features/flow-builder/containers/StepPalettePanel';
import { agentsHref, workspaceHref } from '@/features/flow-builder/logic/helpers/route.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { useActiveWorkspace } from '@/features/workspace';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Topbar } from '@/shared/ui/layout/Topbar';

export function FlowBuilderPage({ workspaceId, agentId }: FlowBuilderPageProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const workspace = useActiveWorkspace(workspaceId);
  const { agentName, draft, loading, failed, retry } = useFlowBuilderDraft(agentId);
  const load = useFlowBuilderStore((state) => state.load);

  useLayoutEffect(() => {
    if (draft !== null) {
      load(draft);
    }
  }, [draft, load]);

  return (
    <div className="flex h-full flex-col">
      <Topbar
        breadcrumbs={{
          ariaLabel: t('breadcrumb'),
          moreLabel: t('breadcrumbMore'),
          items: [
            { label: workspace?.name ?? '', to: workspaceHref(workspaceId) },
            { label: t('agents'), to: agentsHref(workspaceId) },
            { label: agentName ?? '', to: null },
          ],
        }}
      />
      {draft !== null && (
        <div className="flex min-h-0 flex-1">
          <StepPalettePanel />
          <FlowEditor />
        </div>
      )}
      {draft === null && loading && (
        <div className="p-7">
          <Skeleton label={t('loading')} />
        </div>
      )}
      {failed && (
        <div role="alert" className="p-7">
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={t('loadError')}
            actions={
              <Button variant={ButtonVariant.Secondary} onClick={retry}>
                {t('retry')}
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
