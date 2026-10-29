import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface PromptUsagesSectionProps {
  readonly usages: readonly PromptUsageItem[] | null;
  readonly failed: boolean;
  readonly onRetry: () => void;
}
