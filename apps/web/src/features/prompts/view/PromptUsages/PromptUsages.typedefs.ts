import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface PromptUsagesProps {
  readonly usages: readonly PromptUsageItem[];
}
