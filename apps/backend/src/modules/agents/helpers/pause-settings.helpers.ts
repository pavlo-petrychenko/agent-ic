import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import type { PauseSettings } from '@/modules/agents/typedefs/pause-settings.typedefs';

export const pauseSettingsOf = (agent: Agent): PauseSettings | null =>
  agent.pausedAt === null || agent.pauseMode === null
    ? null
    : { mode: agent.pauseMode, awayMessage: agent.awayMessage, pausedAt: agent.pausedAt };
