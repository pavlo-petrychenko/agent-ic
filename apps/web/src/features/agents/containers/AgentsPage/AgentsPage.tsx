import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents/communication/hooks/useAgents';
import { useCreateAgent } from '@/features/agents/communication/hooks/useCreateAgent';
import { BUILDER_PATH, SETTINGS_TEAM_PATH } from '@/features/agents/constants/agentList.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { AgentStatus } from '@/features/agents/constants/agentStatus.constants';
import type { AgentsPageProps } from '@/features/agents/containers/AgentsPage/AgentsPage.typedefs';
import { filterAgents, toStatuses } from '@/features/agents/logic/helpers/agentFilter.helpers';
import { toTableStatus } from '@/features/agents/logic/helpers/agentList.helpers';
import { agentStatusNote } from '@/features/agents/logic/helpers/agentStatus.helpers';
import type { AgentListItem, AgentRow } from '@/features/agents/typedefs/agent.typedefs';
import { AgentsEmpty } from '@/features/agents/view/AgentsEmpty';
import { AgentsTable } from '@/features/agents/view/AgentsTable';
import { SetupChecklist } from '@/features/agents/view/SetupChecklist';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import styles from '@/features/agents/containers/AgentsPage/AgentsPage.module.scss';

export function AgentsPage({ workspaceId }: AgentsPageProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const navigate = useNavigate();
  const router = useRouter();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const active = useActiveWorkspace(workspaceId);
  const { agents, loading, failed, hasNextPage, loadingMore, loadMore, retry } = useAgents();
  const { createAgent, creating } = useCreateAgent();
  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<AgentStatus[]>([]);

  const runGuarded = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const onCreate = () =>
    runGuarded(async () => {
      const agentId = await createAgent(t('create.defaultName'));
      if (agentId !== null) {
        await navigate({ to: BUILDER_PATH, params: { workspaceId, agentId } });
      }
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
      statusLabel: t(`status.${agent.status}`, { version: agent.liveVersionNumber }),
      note: note === null ? null : t(`statusNote.${note}`, { number: agent.draftNumber }),
    };
  };

  const isEmpty = !loading && !failed && agents.length === 0;
  const canInvite =
    active !== null && can(active.role, PermissionResource.Team, PermissionAction.Edit);
  const teamLocation = { to: SETTINGS_TEAM_PATH, params: { workspaceId } };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle', { workspace: active?.name ?? '' })}
        actions={
          isEmpty ? null : (
            <>
              <div className={styles.search}>
                <SearchInput
                  value={query}
                  label={t('filters.search')}
                  clearLabel={t('filters.clearSearch')}
                  placeholder={t('filters.search')}
                  onChange={(event) => setQuery(event.target.value)}
                  onClear={() => setQuery('')}
                />
              </div>
              <Button icon={IconName.Plus} loading={creating} onClick={() => void onCreate()}>
                {t('actions.newAgent')}
              </Button>
            </>
          )
        }
      />
      <div className="flex flex-col gap-4 px-7">
        {isEmpty ? (
          <div className={styles.onboarding}>
            <AgentsEmpty creating={creating} onCreate={() => void onCreate()} />
            <SetupChecklist
              creating={creating}
              inviteHref={canInvite ? router.buildLocation(teamLocation).href : null}
              onStart={() => void onCreate()}
              onInvite={() => void navigate(teamLocation)}
            />
          </div>
        ) : (
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
          />
        )}
      </div>
    </div>
  );
}
