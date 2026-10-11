import type { LlmReasoningEffort } from '@/platform/llm/constants/llm-model.constants';
import type { LlmAnyModelId } from '@/platform/llm/typedefs/llm-model.typedefs';

export interface LlmTags {
  readonly traceName: string;
  readonly workspaceId: string;
  readonly sessionId?: string;
  readonly agentVersionId?: string;
  readonly promptId?: string;
  readonly promptVersion?: number;
}

export interface LlmCallTrace {
  readonly model: LlmAnyModelId;
  readonly fallbackHop: number;
  readonly reasoning: LlmReasoningEffort | null;
}
