import type { FlowDocument } from '@agent-ic/flow';
import type { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import type { agentVersions } from '@/modules/agents/db/agent-versions.table';

export interface AgentVersion {
  readonly id: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly kind: AgentVersionKind;
  readonly number: number | null;
  readonly flow: FlowDocument;
  readonly note: string | null;
  readonly authorId: string | null;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewAgentVersion = typeof agentVersions.$inferInsert;

export interface DraftChanges {
  readonly flow: FlowDocument;
  readonly note: string | null;
}
