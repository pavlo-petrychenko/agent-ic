import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface PromptDetailsPanelProps {
  readonly promptId: string;
  readonly activeVersionId: string | null;
  readonly usages: readonly PromptUsageItem[] | null;
  readonly usagesFailed: boolean;
  readonly onRetryUsages: () => void;
}
