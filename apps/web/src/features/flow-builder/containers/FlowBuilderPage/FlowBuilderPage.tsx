import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDescribeAgent } from '@/features/flow-builder/communication/hooks/useDescribeAgent';
import { useFlowBuilderDraft } from '@/features/flow-builder/communication/hooks/useFlowBuilderDraft';
import { useRenameAgent } from '@/features/flow-builder/communication/hooks/useRenameAgent';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { FlowBuilderPageProps } from '@/features/flow-builder/containers/FlowBuilderPage/FlowBuilderPage.typedefs';
import { useDraftAutosave } from '@/features/flow-builder/containers/FlowBuilderPage/useDraftAutosave';
import { FlowEditor } from '@/features/flow-builder/containers/FlowEditor';
import { IssuesPanel } from '@/features/flow-builder/containers/IssuesPanel';
import { LeaveGuard } from '@/features/flow-builder/containers/LeaveGuard';
import { StepPalettePanel } from '@/features/flow-builder/containers/StepPalettePanel';
import { formatSavedAt } from '@/features/flow-builder/logic/helpers/autosave.helpers';
import { agentsHref, workspaceHref } from '@/features/flow-builder/logic/helpers/route.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { InlineEditField } from '@/features/flow-builder/view/InlineEditField';
import { SaveStatus } from '@/features/flow-builder/view/SaveStatus';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Banner, BannerTone } from '@/shared/ui/display/Banner';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Topbar } from '@/shared/ui/layout/Topbar';
import { BREADCRUMB_SEPARATOR } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function FlowBuilderPage({ workspaceId, agentId }: FlowBuilderPageProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const workspace = useActiveWorkspace(workspaceId);
  const { agentName, agentDescription, baseVersion, draft, loading, failed, retry } =
    useFlowBuilderDraft(agentId);
  const renameAgent = useRenameAgent(agentId);
  const describeAgent = useDescribeAgent(agentId);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { conflict, retry: retrySave } = useDraftAutosave(agentId);

  const save = (request: Promise<void>, message: string) =>
    void request.then(
      () => showToast({ message, tone: ToastTone.Ok }),
      (error: unknown) =>
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err }),
    );
  const load = useFlowBuilderStore((state) => state.load);
  const saveState = useFlowBuilderStore((state) => state.saveState);

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
              <Text kind={TextKind.Small} color={TextColor.Mute} aria-hidden="true">
                {BREADCRUMB_SEPARATOR}
              </Text>
              <InlineEditField
                value={agentName}
                placeholder={agentName}
                editLabel={t('header.rename')}
                inputLabel={t('header.nameLabel')}
                maxLength={AGENT_NAME_MAX_LENGTH}
                required
                current
                onCommit={(name) => save(renameAgent(name), t('header.renamed'))}
              />
              <InlineEditField
                value={agentDescription}
                placeholder={t('header.addDescription')}
                editLabel={t('header.describe')}
                inputLabel={t('header.descriptionLabel')}
                maxLength={AGENT_DESCRIPTION_MAX_LENGTH}
                required={false}
                current={false}
                onCommit={(description) =>
                  save(
                    describeAgent(description === '' ? null : description),
                    t('header.described'),
                  )
                }
              />
              <Text kind={TextKind.Small} color={TextColor.Mute}>
                {baseVersion === null
                  ? t('header.neverPublished')
                  : t('header.editedFrom', { version: baseVersion })}
              </Text>
            </div>
          )
        }
        actions={draft === null ? null : <SaveStatus saveState={saveState} onRetry={retrySave} />}
      />
      {draft !== null && (
        <div className="flex min-h-0 flex-1">
          <StepPalettePanel />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {conflict !== null && (
              <Banner tone={BannerTone.Warn}>
                <span className="flex items-center gap-3">
                  {conflict.savedBy === null || conflict.savedAt === null
                    ? t('conflict.changed')
                    : t('conflict.changedBy', {
                        name: conflict.savedBy,
                        time: formatSavedAt(conflict.savedAt, locale),
                      })}
                  <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={retry}>
                    {t('conflict.reload')}
                  </Button>
                </span>
              </Banner>
            )}
            <FlowEditor />
            <IssuesPanel />
          </div>
          <LeaveGuard />
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
