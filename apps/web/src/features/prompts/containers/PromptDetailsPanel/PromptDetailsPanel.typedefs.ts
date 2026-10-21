import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';
import type { PromptVersionRow } from '@/features/prompts/view/PromptVersions/PromptVersions.typedefs';

export interface PromptDetailsPanelProps {
  readonly promptId: string;
  readonly activeVersionId: string | null;
  readonly onSelect: ((versionId: string) => void) | null;
  readonly onCompare: ((fromId: string, toId: string) => void) | null;
  readonly usages: readonly PromptUsageItem[] | null;
  readonly usagesFailed: boolean;
  readonly onRetryUsages: () => void;
  readonly variablePaths: readonly string[];
}

export interface UsePromptDetailsPanelResult {
  readonly versions: readonly PromptVersionRow[] | null;
  readonly pinnedNumbers: readonly number[];
  readonly versionsFailed: boolean;
  readonly retryVersions: () => void;
  readonly compareVersions: (() => void) | null;
}
