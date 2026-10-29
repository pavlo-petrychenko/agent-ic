import type { AgentVersionKind } from '@/modules/agents/constants/agent.constants';

export interface AutoCloseVersion {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly versionId: string;
  readonly kind: AgentVersionKind;
  readonly live: boolean;
  readonly afterMinutes: number;
}
