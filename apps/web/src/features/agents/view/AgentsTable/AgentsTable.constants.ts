import { AgentStatus } from '@/features/agents/constants/agentStatus.constants';
import { StatusKind } from '@/shared/ui/display/StatusDot';

export const AGENT_STATUS_DOTS: Readonly<Record<AgentStatus, StatusKind>> = {
  [AgentStatus.Live]: StatusKind.Ok,
  [AgentStatus.Draft]: StatusKind.Idle,
  [AgentStatus.Paused]: StatusKind.Warn,
};

export enum AgentColumn {
  Name = 'name',
  Status = 'status',
}

export const AGENT_COLUMN_WIDTHS: Readonly<Record<AgentColumn, string>> = {
  [AgentColumn.Name]: 'minmax(0, 2fr)',
  [AgentColumn.Status]: 'minmax(0, 1fr)',
};
