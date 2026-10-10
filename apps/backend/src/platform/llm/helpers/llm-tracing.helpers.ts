import type { Attributes } from '@opentelemetry/api';
import { LangfuseMode } from '@/platform/config/constants/langfuse.constants';
import type { LangfuseConfig } from '@/platform/config/typedefs/app-config.typedefs';
import {
  LANGFUSE_OBSERVATION_METADATA,
  LANGFUSE_TRACE_METADATA,
  LangfuseAttribute,
  LlmTraceMetadata,
} from '@/platform/llm/constants/llm-tracing.constants';
import type { LlmCallTrace, LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

const traceMetadata = (key: LlmTraceMetadata): string => `${LANGFUSE_TRACE_METADATA}.${key}`;

const observationMetadata = (key: LlmTraceMetadata): string =>
  `${LANGFUSE_OBSERVATION_METADATA}.${key}`;

export const traceSampleRate = (langfuse: LangfuseConfig): number | null =>
  langfuse.mode === LangfuseMode.Off ? null : langfuse.sampleRate;

export const langfuseTraceAttributes = (tags: LlmTags): Attributes => ({
  [LangfuseAttribute.TraceName]: tags.traceName,
  [LangfuseAttribute.SessionId]: tags.sessionId,
  [traceMetadata(LlmTraceMetadata.WorkspaceId)]: tags.workspaceId,
  [traceMetadata(LlmTraceMetadata.AgentVersionId)]: tags.agentVersionId,
  [traceMetadata(LlmTraceMetadata.PromptId)]: tags.promptId,
  [traceMetadata(LlmTraceMetadata.PromptVersion)]: tags.promptVersion,
});

export const llmCallAttributes = (tags: LlmTags, call: LlmCallTrace): Attributes => ({
  ...langfuseTraceAttributes(tags),
  [observationMetadata(LlmTraceMetadata.Model)]: call.model,
  [observationMetadata(LlmTraceMetadata.FallbackHop)]: call.fallbackHop,
  [observationMetadata(LlmTraceMetadata.Reasoning)]: call.reasoning ?? undefined,
});
