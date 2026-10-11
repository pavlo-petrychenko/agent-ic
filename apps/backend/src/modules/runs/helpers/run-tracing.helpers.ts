import type { FlowNode } from '@agent-ic/flow';
import {
  RUN_TRACE_NAME,
  RunStepTraceMetadata,
} from '@/modules/runs/constants/run-tracing.constants';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

export const runTraceTags = (run: Run): LlmTags => ({
  traceName: RUN_TRACE_NAME,
  workspaceId: run.workspaceId,
  sessionId: run.conversationId,
  agentVersionId: run.versionId,
  runId: run.id,
});

export const stepTraceMetadata = (
  node: FlowNode,
  branchKey: string,
): Readonly<Record<RunStepTraceMetadata, string>> => ({
  [RunStepTraceMetadata.NodeId]: node.id,
  [RunStepTraceMetadata.NodeKey]: node.key,
  [RunStepTraceMetadata.NodeType]: node.type,
  [RunStepTraceMetadata.BranchKey]: branchKey,
});
