import type { PromptPin } from '@agent-ic/flow';
import type { PromptUsageVersionKind } from '@/modules/prompts/constants/prompt-usage.constants';

export interface PromptUsage {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly versionKind: PromptUsageVersionKind;
  readonly versionNumber: number | null;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
  readonly pin: PromptPin;
}
