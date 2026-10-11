import type { OpenTelemetrySpanType } from '@ai-sdk/otel';
import { createContextKey } from '@opentelemetry/api';

export const LLM_TRACER = 'LLM_TRACER';
export const LLM_TRACER_NAME = 'agent-ic.llm';
export const LLM_TRACE_SAMPLED = createContextKey('agent-ic.llm-trace-sampled');
export const LLM_TAGGED_SPAN: OpenTelemetrySpanType = 'operation';
export const LLM_TELEMETRY_OFF = { isEnabled: false } as const;

export enum LangfuseAttribute {
  TraceName = 'langfuse.trace.name',
  SessionId = 'langfuse.session.id',
}

export const LANGFUSE_TRACE_METADATA = 'langfuse.trace.metadata';
export const LANGFUSE_OBSERVATION_METADATA = 'langfuse.observation.metadata';

export enum LlmTraceMetadata {
  WorkspaceId = 'workspace_id',
  AgentVersionId = 'agent_version_id',
  PromptId = 'prompt_id',
  PromptVersion = 'prompt_version',
  Model = 'model',
  FallbackHop = 'fallback_hop',
  Reasoning = 'reasoning',
}
