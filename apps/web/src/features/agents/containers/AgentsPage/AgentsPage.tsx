import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents/communication/hooks/useAgents';
import { BUILDER_PATH } from '@/features/agents/constants/agentList.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { AgentsPageProps } from '@/features/agents/containers/AgentsPage/AgentsPage.typedefs';
import { toTableStatus } from '@/features/agents/logic/helpers/agentList.helpers';
import { agentStatusNote } from '@/features/agents/logic/helpers/agentStatus.helpers';
import type { AgentListItem, AgentRow } from '@/features/agents/typedefs/agent.typedefs';
import { AgentsTable } from '@/features/agents/view/AgentsTable';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function AgentsPage({ workspaceId }: AgentsPageProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const workspace = useActiveWorkspace(workspaceId)?.name ?? '';
  const { agents, loading, failed, hasNextPage, loadingMore, loadMore, retry } = useAgents();
  const runGuarded = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
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

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle', { workspace })} />
      <div className="flex flex-col gap-4 px-7">
        {isEmpty ? (
          <Card>
            <EmptyState
              icon={IconName.Agent}
              title={t('empty.title')}
              description={t('empty.description')}
            />
          </Card>
        ) : (
          <AgentsTable
            rows={agents.map(toRow)}
            status={toTableStatus(loading, failed)}
            hasNextPage={hasNextPage}
            loadingMore={loadingMore}
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
