import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDuplicateAgent } from '@/features/agents/communication/hooks/useDuplicateAgent';
import { useResumeAgent } from '@/features/agents/communication/hooks/useResumeAgent';
import { BUILDER_PATH, TESTING_PATH } from '@/features/agents/constants/agentList.constants';
import { AgentMenuAction } from '@/features/agents/constants/agentMenu.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { UseAgentRowMenuResult } from '@/features/agents/containers/AgentsPage/AgentsPage.typedefs';
import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useAgentRowMenu(workspaceId: string): UseAgentRowMenuResult {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { resumeAgent } = useResumeAgent();
  const { duplicateAgent } = useDuplicateAgent();
  const [pauseRow, setPauseRow] = useState<AgentRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<AgentRow | null>(null);

  const guarded = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
      } catch (error) {
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
      }
    },
    [errorMessage, showToast],
  );

  const onAction = useCallback(
    (row: AgentRow, action: AgentMenuAction) => {
      switch (action) {
        case AgentMenuAction.Open:
          return void navigate({ to: BUILDER_PATH, params: { workspaceId, agentId: row.id } });
        case AgentMenuAction.Test:
          return void navigate({
            to: TESTING_PATH,
            params: { workspaceId },
            search: { agent: row.id },
          });
        case AgentMenuAction.Pause:
          return setPauseRow(row);
        case AgentMenuAction.Delete:
          return setDeleteRow(row);
        case AgentMenuAction.Resume:
          return void guarded(async () => {
            await resumeAgent(row.id);
            showToast({ message: t('resume.success', { name: row.name }), tone: ToastTone.Ok });
          });
        case AgentMenuAction.Duplicate:
          return void guarded(async () => {
            const name = await duplicateAgent(row.id);
            showToast({
              message: name === null ? t('duplicate.done') : t('duplicate.success', { name }),
              tone: ToastTone.Ok,
            });
          });
      }
    },
    [duplicateAgent, guarded, navigate, resumeAgent, showToast, t, workspaceId],
  );

  return {
    onAction,
    pauseRow,
    deleteRow,
    closePause: () => setPauseRow(null),
    closeDelete: () => setDeleteRow(null),
  };
}
