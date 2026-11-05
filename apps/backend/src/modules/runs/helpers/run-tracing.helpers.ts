import type { FlowNode } from '@agent-ic/flow';
import type { ResolvedPrompts } from '@/modules/prompts';
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
  trigger: run.trigger,
});

export const stepPromptTags = (
  nodeId: string,
  prompts: ResolvedPrompts,
): Partial<Pick<LlmTags, 'promptId' | 'promptVersion'>> => {
  const resolved = prompts.get(nodeId);
  return resolved === undefined
    ? {}
    : { promptId: resolved.promptRef, promptVersion: resolved.versionNumber };
};

export const stepTraceMetadata = (
  node: FlowNode,
  branchKey: string,
): Readonly<Record<RunStepTraceMetadata, string>> => ({
  [RunStepTraceMetadata.NodeId]: node.id,
  [RunStepTraceMetadata.NodeKey]: node.key,
  [RunStepTraceMetadata.NodeType]: node.type,
  [RunStepTraceMetadata.BranchKey]: branchKey,
});
