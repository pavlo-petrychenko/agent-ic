import { FlowIssueSeverity } from '@agent-ic/flow';
import type { FlowIssue as DomainFlowIssue } from '@agent-ic/flow';
import {
  AgentStatus,
  AgentVersionStatus,
  PauseMode,
} from '@/modules/agents/constants/agent.constants';
import type {
  AgentVersionView,
  PublishedAgent,
  SavedAgentDraft,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import type {
  AgentView,
  AgentsPage,
  PauseAgentInput,
} from '@/modules/agents/typedefs/agent.typedefs';
import type {
  Agent,
  AgentConnection,
  AgentVersion,
  FlowIssue,
  PauseAgentInput as GraphqlPauseAgentInput,
  PublishAgentPayload,
  SaveAgentDraftPayload,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  AgentStatus as GraphqlAgentStatus,
  AgentVersionStatus as GraphqlAgentVersionStatus,
  FlowIssueSeverity as GraphqlFlowIssueSeverity,
  PauseMode as GraphqlPauseMode,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_AGENT_STATUS: Readonly<Record<AgentStatus, GraphqlAgentStatus>> = {
  [AgentStatus.Draft]: GraphqlAgentStatus.Draft,
  [AgentStatus.Live]: GraphqlAgentStatus.Live,
  [AgentStatus.Paused]: GraphqlAgentStatus.Paused,
};

const GRAPHQL_VERSION_STATUS: Readonly<Record<AgentVersionStatus, GraphqlAgentVersionStatus>> = {
  [AgentVersionStatus.Draft]: GraphqlAgentVersionStatus.Draft,
  [AgentVersionStatus.Live]: GraphqlAgentVersionStatus.Live,
  [AgentVersionStatus.Archived]: GraphqlAgentVersionStatus.Archived,
};

const GRAPHQL_PAUSE_MODE: Readonly<Record<PauseMode, GraphqlPauseMode>> = {
  [PauseMode.Inbox]: GraphqlPauseMode.Inbox,
  [PauseMode.AwayMessage]: GraphqlPauseMode.AwayMessage,
};

const PAUSE_MODE_FROM_GRAPHQL: Readonly<Record<GraphqlPauseMode, PauseMode>> = {
  [GraphqlPauseMode.Inbox]: PauseMode.Inbox,
  [GraphqlPauseMode.AwayMessage]: PauseMode.AwayMessage,
};

const GRAPHQL_ISSUE_SEVERITY: Readonly<Record<FlowIssueSeverity, GraphqlFlowIssueSeverity>> = {
  [FlowIssueSeverity.Error]: GraphqlFlowIssueSeverity.Error,
  [FlowIssueSeverity.Warning]: GraphqlFlowIssueSeverity.Warning,
};

export const toGraphqlAgent = (agent: AgentView): Agent => ({
  id: agent.id,
  name: agent.name,
  description: agent.description,
  status: GRAPHQL_AGENT_STATUS[agent.status],
  liveVersionNumber: agent.liveVersionNumber,
  draftNumber: agent.draftNumber,
  draftBaseVersionNumber: agent.draftBaseVersionNumber,
  hasUnpublishedChanges: agent.hasUnpublishedChanges,
  versionCount: agent.versionCount,
  pausedAt: agent.pausedAt?.toISOString() ?? null,
  pauseMode: agent.pauseMode === null ? null : GRAPHQL_PAUSE_MODE[agent.pauseMode],
  awayMessage: agent.awayMessage,
  createdAt: agent.createdAt.toISOString(),
  updatedAt: agent.updatedAt.toISOString(),
});

export const toGraphqlAgentConnection = (page: AgentsPage): AgentConnection => ({
  pageInfo: page.pageInfo,
  edges: page.edges.map((edge) => ({ cursor: edge.cursor, node: toGraphqlAgent(edge.node) })),
});

export const toGraphqlAgentVersion = (version: AgentVersionView): AgentVersion => ({
  id: version.id,
  status: GRAPHQL_VERSION_STATUS[version.status],
  number: version.number,
  flow: version.flow,
  note: version.note,
  author: version.author,
  publishedAt: version.publishedAt?.toISOString() ?? null,
  createdAt: version.createdAt.toISOString(),
});

export const toGraphqlFlowIssue = (issue: DomainFlowIssue): FlowIssue => ({
  code: issue.code,
  severity: GRAPHQL_ISSUE_SEVERITY[issue.severity],
  nodeId: issue.nodeId,
  edgeId: issue.edgeId,
  path: issue.path,
  params: issue.params,
});

export const toGraphqlSavedDraft = (saved: SavedAgentDraft): SaveAgentDraftPayload => ({
  version: toGraphqlAgentVersion(saved.version),
  issues: saved.issues.map(toGraphqlFlowIssue),
});

export const toGraphqlPublishedAgent = (published: PublishedAgent): PublishAgentPayload => ({
  agent: toGraphqlAgent(published.agent),
  version: toGraphqlAgentVersion(published.version),
});

export const toPauseAgentInput = (input: GraphqlPauseAgentInput): PauseAgentInput => ({
  id: input.id,
  mode: PAUSE_MODE_FROM_GRAPHQL[input.mode],
  awayMessage: input.awayMessage,
});
