import type { FlowDiff, FlowDocument, FlowIssue } from '@agent-ic/flow';
import type {
  AgentVersionKind,
  AgentVersionStatus,
  SimulatorCheckStatus,
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
  readonly revision: number;
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
  readonly authorId: string;
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
  readonly revision: number;
  readonly note?: string | null;
}

export interface GetAgentDraftInput {
  readonly agentId: string;
}

export interface ListAgentVersionsInput {
  readonly agentId: string;
}

export interface AgentDraftView {
  readonly version: AgentVersionView;
  readonly revision: number;
  readonly savedAt: Date;
  readonly issues: readonly FlowIssue[];
}

export interface PublishedAgent {
  readonly agent: AgentView;
  readonly version: AgentVersionView;
}

export interface AgentVersionDiffInput {
  readonly agentId: string;
  readonly fromId: string;
  readonly toId: string;
}

export interface PublishPreviewInput {
  readonly agentId: string;
}

export interface SimulatorCheck {
  readonly status: SimulatorCheckStatus;
  readonly testedAt: Date | null;
}

export interface PublishPreview {
  readonly diff: FlowDiff;
  readonly errors: readonly FlowIssue[];
  readonly warnings: readonly FlowIssue[];
  readonly simulator: SimulatorCheck;
}
