import { AgentStatus } from '@/features/agents/constants/agentStatus.constants';
import { BadgeTone } from '@/shared/ui/display/Badge';

export const AGENT_STATUS_TONES: Readonly<Record<AgentStatus, BadgeTone>> = {
  [AgentStatus.Live]: BadgeTone.Ok,
  [AgentStatus.Draft]: BadgeTone.Neutral,
  [AgentStatus.Paused]: BadgeTone.Warn,
};

export enum AgentColumn {
  Name = 'name',
  Status = 'status',
}

export const AGENT_COLUMN_WIDTHS: Readonly<Record<AgentColumn, string>> = {
  [AgentColumn.Name]: 'minmax(0, 2fr)',
  [AgentColumn.Status]: 'minmax(0, 1fr)',
};

export const STATUS_FILTER_ID = 'status';
