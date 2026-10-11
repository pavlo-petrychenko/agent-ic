import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import type { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';

export interface LlmUsageReport {
  readonly workspaceId: string;
  readonly source: LlmProviderKind;
  readonly model: LlmModelId;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly credits: number;
  readonly metered: boolean;
}
