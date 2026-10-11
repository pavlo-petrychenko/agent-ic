import { AgentStatus } from '@/features/agents/constants/agentStatus.constants';

export enum AgentMenuAction {
  Open = 'open',
  Test = 'test',
  Pause = 'pause',
  Resume = 'resume',
  Duplicate = 'duplicate',
  Delete = 'delete',
}

export const AGENT_MENU_ACTIONS: Readonly<Record<AgentStatus, readonly AgentMenuAction[]>> = {
  [AgentStatus.Live]: [
    AgentMenuAction.Open,
    AgentMenuAction.Test,
    AgentMenuAction.Pause,
    AgentMenuAction.Duplicate,
    AgentMenuAction.Delete,
  ],
  [AgentStatus.Paused]: [
    AgentMenuAction.Open,
    AgentMenuAction.Test,
    AgentMenuAction.Resume,
    AgentMenuAction.Duplicate,
    AgentMenuAction.Delete,
  ],
  [AgentStatus.Draft]: [
    AgentMenuAction.Open,
    AgentMenuAction.Test,
    AgentMenuAction.Duplicate,
    AgentMenuAction.Delete,
  ],
};
