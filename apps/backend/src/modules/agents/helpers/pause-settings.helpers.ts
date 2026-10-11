import { AGENT_AWAY_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { PauseMode } from '@/modules/agents/constants/agent.constants';
import { AwayMessageRequiredError } from '@/modules/agents/errors/away-message-required.error';
import { AwayMessageTooLongError } from '@/modules/agents/errors/away-message-too-long.error';
import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import type { PauseSettings } from '@/modules/agents/typedefs/pause-settings.typedefs';

export const pauseSettingsOf = (agent: Agent): PauseSettings | null =>
  agent.pausedAt === null || agent.pauseMode === null
    ? null
    : { mode: agent.pauseMode, awayMessage: agent.awayMessage, pausedAt: agent.pausedAt };

export const buildPauseSettings = (
  mode: PauseMode,
  awayMessage: string | null | undefined,
  pausedAt: Date,
): PauseSettings => {
  if (mode === PauseMode.Inbox) {
    return { mode, awayMessage: null, pausedAt };
  }
  const text = awayMessage?.trim() ?? '';
  if (text.length === 0) {
    throw new AwayMessageRequiredError();
  }
  if (text.length > AGENT_AWAY_MESSAGE_MAX_LENGTH) {
    throw new AwayMessageTooLongError();
  }
  return { mode, awayMessage: text, pausedAt };
};
