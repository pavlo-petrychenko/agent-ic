import { AGENT_AWAY_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePauseAgent } from '@/features/agents/communication/hooks/usePauseAgent';
import type { AwayMessageIssue } from '@/features/agents/constants/agentPause.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { PauseAgentDialogProps } from '@/features/agents/containers/PauseAgentDialog/PauseAgentDialog.typedefs';
import { validateAwayMessage } from '@/features/agents/logic/helpers/agentPause.helpers';
import { PauseAgentModal } from '@/features/agents/view/PauseAgentModal';
import { PauseMode } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function PauseAgentDialog({ agent, onClose }: PauseAgentDialogProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { pauseAgent, pausing } = usePauseAgent();
  const [mode, setMode] = useState(PauseMode.Inbox);
  const [awayMessage, setAwayMessage] = useState('');
  const [issue, setIssue] = useState<AwayMessageIssue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    const text = awayMessage.trim();
    const found = mode === PauseMode.AwayMessage ? validateAwayMessage(text) : null;
    setIssue(found);
    if (found !== null) {
      return;
    }
    try {
      await pauseAgent(agent.id, mode, mode === PauseMode.AwayMessage ? text : null);
      showToast({ message: t('pause.success', { name: agent.name }), tone: ToastTone.Ok });
      onClose();
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
    }
  };

  return (
    <PauseAgentModal
      agentName={agent.name}
      statusLabel={agent.statusLabel}
      liveVersionNumber={agent.liveVersionNumber}
      mode={mode}
      awayMessage={awayMessage}
      awayMessageError={
        issue === null ? null : t(`pause.issue.${issue}`, { max: AGENT_AWAY_MESSAGE_MAX_LENGTH })
      }
      submitting={pausing}
      error={error}
      onModeChange={setMode}
      onAwayMessageChange={(text) => {
        setAwayMessage(text);
        setIssue(null);
      }}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
