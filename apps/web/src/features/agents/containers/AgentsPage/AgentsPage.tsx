import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { AgentTemplateKey } from '@agent-ic/flow';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents/communication/hooks/useAgents';
import { useCreateAgent } from '@/features/agents/communication/hooks/useCreateAgent';
import {
  AGENTS_PATH,
  BUILDER_PATH,
  SETTINGS_TEAM_PATH,
  SETTINGS_USAGE_PATH,
} from '@/features/agents/constants/agentList.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import { TEMPLATES_SEARCH_OPEN } from '@/features/agents/constants/agentsSearch.constants';
import type { AgentStatus } from '@/features/agents/constants/agentStatus.constants';
import { GalleryTab } from '@/features/agents/constants/agentTemplate.constants';
import type { AgentsPageProps } from '@/features/agents/containers/AgentsPage/AgentsPage.typedefs';
import { useAgentRowMenu } from '@/features/agents/containers/AgentsPage/useAgentRowMenu';
import { DeleteAgentDialog } from '@/features/agents/containers/DeleteAgentDialog';
import { PauseAgentDialog } from '@/features/agents/containers/PauseAgentDialog';
import { TemplateGalleryDialog } from '@/features/agents/containers/TemplateGalleryDialog';
import { filterAgents, toStatuses } from '@/features/agents/logic/helpers/agentFilter.helpers';
import { toTableStatus } from '@/features/agents/logic/helpers/agentList.helpers';
import { agentStatusNote } from '@/features/agents/logic/helpers/agentStatus.helpers';
import { cardsOfTab } from '@/features/agents/logic/helpers/agentTemplate.helpers';
import { useAgentTemplates } from '@/features/agents/logic/hooks/useAgentTemplates';
import type { AgentListItem, AgentRow } from '@/features/agents/typedefs/agent.typedefs';
import { AgentsEmpty } from '@/features/agents/view/AgentsEmpty';
import { AgentsTable } from '@/features/agents/view/AgentsTable';
import { SetupChecklist, SetupInviteAction } from '@/features/agents/view/SetupChecklist';
import type { SetupInvite } from '@/features/agents/view/SetupChecklist';
import { TourAnchor, tourAnchor } from '@/features/onboarding';
import { copyText, formatUsageDay, useInviteLink, useUsageStatus } from '@/features/settings';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button } from '@/shared/ui/actions/Button';
import { AttentionCard } from '@/shared/ui/display/AttentionCard';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function AgentsPage({ workspaceId, templatesOpen, templateKey }: AgentsPageProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const navigate = useNavigate();
  const router = useRouter();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { locale } = useLocale();
  const active = useActiveWorkspace(workspaceId);
  const { status: usageStatus, limitReached } = useUsageStatus();
  const { agents, loading, failed, hasNextPage, loadingMore, loadMore, retry } = useAgents();
  const { createAgent, creating } = useCreateAgent();
  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<AgentStatus[]>([]);
  const rowMenu = useAgentRowMenu(workspaceId);

  const runGuarded = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const createBlankAgent = async () => {
    const agentId = await createAgent(t('create.defaultName'));
    if (agentId !== null) {
      await navigate({ to: BUILDER_PATH, params: { workspaceId, agentId } });
    }
  };

  const onCreate = () => runGuarded(createBlankAgent);

  const canCreate =
    active !== null &&
    can(active.role, PermissionResource.Agents, PermissionAction.Edit) &&
    can(active.role, PermissionResource.Prompts, PermissionAction.Edit);
  const templates = useAgentTemplates(active?.timeZone ?? null);
  const galleryOpen = canCreate && (templatesOpen || templateKey !== null);

  const showGallery = (key: AgentTemplateKey | null) =>
    navigate({
      to: AGENTS_PATH,
      params: { workspaceId },
      search: { templates: TEMPLATES_SEARCH_OPEN, template: key },
      replace: true,
    });

  const closeGallery = () =>
    navigate({
      to: AGENTS_PATH,
      params: { workspaceId },
      search: { templates: null, template: null },
      replace: true,
    });

  const onClearFilters = () => {
    setQuery('');
    setStatuses([]);
  };

  const toRow = (agent: AgentListItem): AgentRow => {
    const note = agentStatusNote(agent);
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      liveVersionNumber: agent.liveVersionNumber,
      versionCount: agent.versionCount,
      statusLabel: t(`status.${agent.status}`, { version: agent.liveVersionNumber }),
      note: note === null ? null : t(`statusNote.${note}`, { number: agent.draftNumber }),
    };
  };

  const isEmpty = !loading && !failed && agents.length === 0;
  const canInvite =
    active !== null && can(active.role, PermissionResource.Team, PermissionAction.Edit);
  const { link: inviteLink, loading: inviteLoading } = useInviteLink({
    skip: !isEmpty || !canInvite,
  });
  const teamLocation = { to: SETTINGS_TEAM_PATH, params: { workspaceId } };
  const invite: SetupInvite | null = canInvite
    ? {
        action:
          inviteLink === null && !inviteLoading
            ? SetupInviteAction.OpenTeam
            : SetupInviteAction.Copy,
        teamHref: router.buildLocation(teamLocation).href,
        loading: inviteLoading,
      }
    : null;

  const onCopyInvite = () => {
    if (inviteLink !== null) {
      void runGuarded(async () => {
        await copyText(inviteLink.url);
        showToast({ message: t('setup.inviteCopied'), tone: ToastTone.Ok });
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle', { workspace: active?.name ?? '' })}
        actions={
          isEmpty ? null : (
            <>
              <div className="w-(--size-agents-search-width) max-w-full">
                <SearchInput
                  value={query}
                  label={t('filters.search')}
                  clearLabel={t('filters.clearSearch')}
                  placeholder={t('filters.search')}
                  onChange={(event) => setQuery(event.target.value)}
                  onClear={() => setQuery('')}
                />
              </div>
              {canCreate && (
                <Button
                  {...tourAnchor(TourAnchor.NewAgent)}
                  icon={IconName.Plus}
                  onClick={() => void showGallery(null)}
                >
                  {t('actions.newAgent')}
                </Button>
              )}
            </>
          )
        }
      />
      <div className="flex flex-col gap-4 px-7">
        {isEmpty ? (
          <div className="grid grid-cols-1 items-start gap-5 default:grid-cols-[minmax(0,1fr)_var(--size-agents-setup-width)]">
            <AgentsEmpty
              creating={creating}
              canCreate={canCreate}
              templates={cardsOfTab(templates, GalleryTab.Examples)}
              onBrowseTemplates={() => void showGallery(null)}
              onCreateBlank={() => void onCreate()}
              onUseTemplate={(key) => void showGallery(key)}
            />
            <SetupChecklist
              canStart={canCreate}
              invite={invite}
              onStart={() => void showGallery(null)}
              onCopyInvite={onCopyInvite}
              onOpenTeam={() => void navigate(teamLocation)}
            />
          </div>
        ) : (
          <div
            className={
              limitReached && usageStatus !== null
                ? 'grid grid-cols-[minmax(0,1fr)_var(--size-agents-setup-width)] items-start gap-5'
                : undefined
            }
          >
            <AgentsTable
              rows={filterAgents(agents, query, statuses).map(toRow)}
              status={toTableStatus(loading, failed)}
              statusIds={statuses}
              hasNextPage={hasNextPage}
              loadingMore={loadingMore}
              onStatusIdsChange={(ids) => setStatuses(toStatuses(ids))}
              onClearFilters={onClearFilters}
              onLoadMore={() => void runGuarded(loadMore)}
              onRetry={() => void runGuarded(retry)}
              onOpen={(row) =>
                void navigate({ to: BUILDER_PATH, params: { workspaceId, agentId: row.id } })
              }
              onAction={rowMenu.onAction}
            />
            {limitReached && usageStatus !== null && (
              <AttentionCard
                title={t('attention.title')}
                rows={[
                  {
                    id: 'usage-limit',
                    icon: IconName.Alert,
                    title: t('attention.usageLimit.title'),
                    meta: t('attention.usageLimit.meta', {
                      date: formatUsageDay(usageStatus.periodEnd, locale),
                    }),
                    action: {
                      label: t('attention.usageLimit.action'),
                      href: router.buildLocation({
                        to: SETTINGS_USAGE_PATH,
                        params: { workspaceId },
                      }).href,
                    },
                  },
                ]}
              />
            )}
          </div>
        )}
      </div>
      {galleryOpen && (
        <TemplateGalleryDialog
          workspaceId={workspaceId}
          templates={templates}
          selectedKey={templateKey}
          blankCreating={creating}
          onSelect={(key) => void showGallery(key)}
          onClose={() => void closeGallery()}
          onCreateBlank={createBlankAgent}
        />
      )}
      {rowMenu.pauseRow !== null && (
        <PauseAgentDialog
          key={rowMenu.pauseRow.id}
          agent={rowMenu.pauseRow}
          onClose={rowMenu.closePause}
        />
      )}
      {rowMenu.deleteRow !== null && (
        <DeleteAgentDialog
          key={rowMenu.deleteRow.id}
          agent={rowMenu.deleteRow}
          onClose={rowMenu.closeDelete}
        />
      )}
    </div>
  );
}
