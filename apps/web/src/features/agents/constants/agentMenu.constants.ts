import { AgentStatus } from '@/features/agents/constants/agentStatus.constants';

export enum AgentMenuAction {
  Open = 'open',
  Test = 'test',
  Resume = 'resume',
  Duplicate = 'duplicate',
}

export const AGENT_MENU_ACTIONS: Readonly<Record<AgentStatus, readonly AgentMenuAction[]>> = {
  [AgentStatus.Live]: [AgentMenuAction.Open, AgentMenuAction.Test, AgentMenuAction.Duplicate],
  [AgentStatus.Paused]: [
    AgentMenuAction.Open,
    AgentMenuAction.Test,
    AgentMenuAction.Resume,
    AgentMenuAction.Duplicate,
  ],
  [AgentStatus.Draft]: [AgentMenuAction.Open, AgentMenuAction.Test, AgentMenuAction.Duplicate],
};
