import type { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import type { LlmAnyModelId } from '@/platform/llm/typedefs/llm-model.typedefs';

export interface LlmUsageReport {
  readonly workspaceId: string;
  readonly source: LlmProviderKind;
  readonly model: LlmAnyModelId;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly credits: number;
  readonly metered: boolean;
}
