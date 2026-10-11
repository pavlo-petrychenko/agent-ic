import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFlowBuilderDraft } from '@/features/flow-builder/communication/hooks/useFlowBuilderDraft';
import { useRenameAgent } from '@/features/flow-builder/communication/hooks/useRenameAgent';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { FlowBuilderPageProps } from '@/features/flow-builder/containers/FlowBuilderPage/FlowBuilderPage.typedefs';
import { FlowEditor } from '@/features/flow-builder/containers/FlowEditor';
import { StepPalettePanel } from '@/features/flow-builder/containers/StepPalettePanel';
import { agentsHref, workspaceHref } from '@/features/flow-builder/logic/helpers/route.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { AgentNameField } from '@/features/flow-builder/view/AgentNameField';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Topbar } from '@/shared/ui/layout/Topbar';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function FlowBuilderPage({ workspaceId, agentId }: FlowBuilderPageProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const workspace = useActiveWorkspace(workspaceId);
  const { agentName, baseVersion, draft, loading, failed, retry } = useFlowBuilderDraft(agentId);
  const renameAgent = useRenameAgent(agentId);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const rename = (name: string) =>
    void renameAgent(name).then(
      () => showToast({ message: t('header.renamed'), tone: ToastTone.Ok }),
      (error: unknown) =>
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err }),
    );
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
          ],
        }}
        status={
          agentName === null ? null : (
            <div className="flex items-center gap-3">
              <AgentNameField name={agentName} onRename={rename} />
              <Text kind={TextKind.Small} color={TextColor.Mute}>
                {baseVersion === null
                  ? t('header.neverPublished')
                  : t('header.editedFrom', { version: baseVersion })}
              </Text>
            </div>
          )
        }
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
