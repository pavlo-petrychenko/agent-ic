import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface PromptViewProps {
  readonly versionNumber: number | null;
  readonly text: string;
  readonly savedLabel: string | null;
  readonly variables: readonly VariableOption[];
  readonly normalizeVariable: (path: string) => string;
  readonly olderThanVersionNumber: number | null;
  readonly onBackToLatest: (() => void) | null;
}
