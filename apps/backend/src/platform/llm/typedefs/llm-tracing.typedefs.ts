import type { ReasoningLevel } from '@agent-ic/contracts';

export interface LlmTags {
  readonly traceName: string;
  readonly workspaceId: string;
  readonly sessionId?: string;
  readonly agentVersionId?: string;
  readonly runId?: string;
  readonly promptId?: string;
  readonly promptVersion?: number;
}

export interface LlmCallTrace {
  readonly model: string;
  readonly fallbackHop: number;
  readonly reasoning: ReasoningLevel | null;
}
