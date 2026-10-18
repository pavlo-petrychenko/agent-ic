import type { FlowDocument } from '@agent-ic/flow';

export interface AgentVersionFlow {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly flow: FlowDocument;
}
