import type { LlmModelId, LlmReasoningEffort } from '@/platform/llm/constants/llm-model.constants';

export interface LlmTags {
  readonly traceName: string;
  readonly workspaceId: string;
  readonly sessionId?: string;
  readonly agentVersionId?: string;
  readonly promptId?: string;
  readonly promptVersion?: number;
}

export interface LlmCallTrace {
  readonly model: LlmModelId;
  readonly fallbackHop: number;
  readonly reasoning: LlmReasoningEffort | null;
}
