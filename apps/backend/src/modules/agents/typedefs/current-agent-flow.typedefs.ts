import type { FlowDocument } from '@agent-ic/flow';
import type { AgentVersionKind } from '@/modules/agents/constants/agent.constants';

export interface CurrentAgentFlow {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly versionKind: AgentVersionKind;
  readonly versionNumber: number | null;
  readonly flow: FlowDocument;
}
