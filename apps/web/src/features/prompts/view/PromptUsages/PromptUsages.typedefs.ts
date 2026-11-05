import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface PromptUsagesProps {
  readonly usages: readonly PromptUsageItem[];
  readonly onOpenUsage: (usage: PromptUsageItem) => void;
}
