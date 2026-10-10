import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import type {
  AgentVersionKind,
  AgentVersionStatus,
} from '@/modules/agents/constants/agent.constants';
import type { agentVersions } from '@/modules/agents/db/agent-versions.table';
import type { AgentView } from '@/modules/agents/typedefs/agent.typedefs';

export interface AgentVersion {
  readonly id: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly kind: AgentVersionKind;
  readonly number: number | null;
  readonly flow: FlowDocument;
  readonly note: string | null;
  readonly authorId: string | null;
  readonly baseVersionId: string | null;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewAgentVersion = typeof agentVersions.$inferInsert;

export interface VersionCopy {
  readonly id: string;
  readonly kind: AgentVersionKind;
  readonly number: number | null;
  readonly authorId: string | null;
  readonly publishedAt: Date | null;
  readonly at: Date;
}

export interface AgentVersionLabels {
  readonly id: string;
  readonly status: AgentVersionStatus;
  readonly author: AgentVersionAuthor | null;
}

export interface PublishRequest {
  readonly authorId: string;
  readonly note?: string | null;
}

export interface DraftChanges {
  readonly flow: FlowDocument;
  readonly note: string | null;
}

export interface AgentVersionAuthor {
  readonly name: string;
}

export interface AgentVersionView {
  readonly id: string;
  readonly kind: AgentVersionKind;
  readonly status: AgentVersionStatus;
  readonly number: number | null;
  readonly flow: FlowDocument;
  readonly note: string | null;
  readonly author: AgentVersionAuthor | null;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
}

export interface SaveAgentDraftInput {
  readonly id: string;
  readonly flow: unknown;
  readonly note?: string | null;
}

export interface ListAgentVersionsInput {
  readonly agentId: string;
}

export interface SavedAgentDraft {
  readonly version: AgentVersionView;
  readonly issues: readonly FlowIssue[];
}

export interface PublishedAgent {
  readonly agent: AgentView;
  readonly version: AgentVersionView;
}
