import { useNavigate } from '@tanstack/react-router';
import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFlowBuilderDraft } from '@/features/flow-builder/communication/hooks/useFlowBuilderDraft';
import { useSaveAgentDetails } from '@/features/flow-builder/communication/hooks/useSaveAgentDetails';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { VERSIONS_PATH } from '@/features/flow-builder/constants/publish.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import type { FlowBuilderPageProps } from '@/features/flow-builder/containers/FlowBuilderPage/FlowBuilderPage.typedefs';
import { useDraftAutosave } from '@/features/flow-builder/containers/FlowBuilderPage/useDraftAutosave';
import { FlowEditor } from '@/features/flow-builder/containers/FlowEditor';
import { InspectorPanel } from '@/features/flow-builder/containers/InspectorPanel';
import { IssuesPanel } from '@/features/flow-builder/containers/IssuesPanel';
import { LastRunBar } from '@/features/flow-builder/containers/LastRunBar';
import { LeaveGuard } from '@/features/flow-builder/containers/LeaveGuard';
import { PublishDialog } from '@/features/flow-builder/containers/PublishDialog';
import { StepPalettePanel } from '@/features/flow-builder/containers/StepPalettePanel';
import {
  normalizeAgentDetails,
  sameAgentDetails,
} from '@/features/flow-builder/logic/helpers/agentDetails.helpers';
import { formatSavedAt } from '@/features/flow-builder/logic/helpers/autosave.helpers';
import { isBlocking } from '@/features/flow-builder/logic/helpers/issue.helpers';
import { agentsHref, workspaceHref } from '@/features/flow-builder/logic/helpers/route.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { AgentDetails } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import { AgentDetailsPopover } from '@/features/flow-builder/view/AgentDetailsPopover';
import { SaveStatus } from '@/features/flow-builder/view/SaveStatus';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Banner, BannerTone } from '@/shared/ui/display/Banner';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Topbar } from '@/shared/ui/layout/Topbar';
import { BREADCRUMB_SEPARATOR } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Tooltip } from '@/shared/ui/overlays/Tooltip';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function FlowBuilderPage({ workspaceId, agentId, nodeId }: FlowBuilderPageProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const workspace = useActiveWorkspace(workspaceId);
  const {
    agentName,
    agentDescription,
    baseVersion,
    draftNumber,
    liveVersion,
    hasUnpublishedChanges,
    draft,
    loading,
    failed,
    retry,
  } = useFlowBuilderDraft(agentId);
  const saveAgentDetails = useSaveAgentDetails(agentId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { conflict, retry: retrySave } = useDraftAutosave(agentId);
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);
  const errorCount = useFlowIssues().filter(isBlocking).length;

  const saveDetails = async (current: AgentDetails, edited: AgentDetails) => {
    const next = normalizeAgentDetails(edited);
    if (sameAgentDetails(current, next)) {
      setDetailsOpen(false);
      return;
    }
    setSavingDetails(true);
    try {
      await saveAgentDetails(current, next);
      setDetailsOpen(false);
      showToast({ message: t('details.saved'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSavingDetails(false);
    }
  };
  const load = useFlowBuilderStore((state) => state.load);
  const select = useFlowBuilderStore((state) => state.select);
  const saveState = useFlowBuilderStore((state) => state.saveState);
  const unchanged =
    saveState === SaveState.Idle && hasUnpublishedChanges === false && liveVersion !== null;
  const publishBlocked =
    unchanged && liveVersion !== null
      ? t('publish.blocked.noChanges', { version: liveVersion })
      : errorCount > 0
        ? t('publish.blocked.errors', { count: errorCount })
        : null;
  const publishButton = (
    <Button
      size={ButtonSize.Sm}
      disabled={publishBlocked !== null}
      onClick={() => setPublishing(true)}
    >
      {draftNumber === null
        ? t('publish.submitNoVersion')
        : t('publish.submit', { version: draftNumber })}
    </Button>
  );

  useLayoutEffect(() => {
    if (draft !== null) {
      load(draft);
      const linked = draft.document.nodes.find((node) => node.id === nodeId);
      if (linked !== undefined) {
        select({ nodeIds: [linked.id], edgeIds: [] });
      }
    }
  }, [draft, load, nodeId, select]);

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
            <div className="flex min-w-0 items-center gap-3">
              <Text kind={TextKind.Body} color={TextColor.Mute} aria-hidden="true">
                {BREADCRUMB_SEPARATOR}
              </Text>
              <AgentDetailsPopover
                details={{ name: agentName, description: agentDescription }}
                open={detailsOpen}
                saving={savingDetails}
                onOpenChange={setDetailsOpen}
                onSave={(edited) =>
                  void saveDetails({ name: agentName, description: agentDescription }, edited)
                }
              />
              <Badge tone={baseVersion === null ? BadgeTone.Neutral : BadgeTone.Warn} dot>
                {baseVersion === null
                  ? t('header.neverPublished')
                  : t('header.editedFrom', { version: baseVersion })}
              </Badge>
            </div>
          )
        }
        actions={
          draft === null ? null : (
            <div className="flex items-center gap-3">
              <SaveStatus saveState={saveState} onRetry={retrySave} />
              {publishBlocked === null ? (
                publishButton
              ) : (
                <Tooltip content={publishBlocked}>
                  {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                  <span tabIndex={0} className="inline-flex">
                    {publishButton}
                  </span>
                </Tooltip>
              )}
            </div>
          )
        }
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
            <LastRunBar workspaceId={workspaceId} agentId={agentId} />
          </div>
          <InspectorPanel agentId={agentId} />
          <LeaveGuard />
          {publishing && (
            <PublishDialog
              agentId={agentId}
              agentName={agentName ?? ''}
              onPublished={() => void navigate({ to: VERSIONS_PATH, params: { workspaceId } })}
              onClose={() => setPublishing(false)}
            />
          )}
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
