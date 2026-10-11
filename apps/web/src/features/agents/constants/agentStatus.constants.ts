import { AgentStatus as ApiAgentStatus } from '@/shared/api/generated/schema.generated';

export enum AgentStatus {
  Draft = 'draft',
  Live = 'live',
  Paused = 'paused',
}

export const AGENT_STATUS_FROM_API: Readonly<Record<ApiAgentStatus, AgentStatus>> = {
  [ApiAgentStatus.Draft]: AgentStatus.Draft,
  [ApiAgentStatus.Live]: AgentStatus.Live,
  [ApiAgentStatus.Paused]: AgentStatus.Paused,
};

export enum AgentStatusNote {
  DraftInProgress = 'draftInProgress',
  NeverPublished = 'neverPublished',
}
