import type { PromptVersionRow } from '@/features/prompts/view/PromptVersions/PromptVersions.typedefs';

export interface PromptVersionsSectionProps {
  readonly versions: readonly PromptVersionRow[] | null;
  readonly pinnedNumbers: readonly number[];
  readonly activeId: string | null;
  readonly failed: boolean;
  readonly onRetry: () => void;
}
