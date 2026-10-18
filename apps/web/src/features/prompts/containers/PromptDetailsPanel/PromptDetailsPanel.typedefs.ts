import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface PromptDetailsPanelProps {
  readonly promptId: string;
  readonly activeVersionId: string | null;
  readonly usages: readonly PromptUsageItem[] | null;
  readonly usagesFailed: boolean;
  readonly onRetryUsages: () => void;
  readonly onSelect: ((versionId: string) => void) | null;
  readonly onCompare: ((fromId: string, toId: string) => void) | null;
  readonly variablePaths: readonly string[];
}
