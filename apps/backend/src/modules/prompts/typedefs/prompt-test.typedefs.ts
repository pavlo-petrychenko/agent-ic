import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';

export interface PromptTestVariable {
  readonly name: string;
  readonly value: string;
}

export interface TestPromptInput {
  readonly promptId: string;
  readonly text: string;
  readonly versionNumber?: number | null;
  readonly variables: readonly PromptTestVariable[];
  readonly customerMessage: string;
  readonly model: string;
}

export interface PromptTestUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface PromptTestResult {
  readonly output: Record<string, unknown>;
  readonly model: LlmModelId;
  readonly usage: PromptTestUsage;
  readonly durationMs: number;
}
