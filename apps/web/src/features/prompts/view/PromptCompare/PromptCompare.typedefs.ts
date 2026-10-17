import type { PromptDiffRow } from '@/features/prompts/typedefs/promptCompare.typedefs';

export interface PromptCompareOption {
  readonly id: string;
  readonly number: number;
}

export interface PromptCompareVersion {
  readonly id: string;
  readonly number: number;
  readonly date: string;
  readonly author: string | null;
  readonly note: string | null;
}

export interface PromptCompareDiff {
  readonly rows: readonly PromptDiffRow[];
  readonly removed: number;
  readonly added: number;
}

export interface PromptCompareProps {
  readonly fromId: string;
  readonly toId: string;
  readonly options: readonly PromptCompareOption[];
  readonly from: PromptCompareVersion | null;
  readonly to: PromptCompareVersion | null;
  readonly diff: PromptCompareDiff | null;
  readonly failed: boolean;
  readonly onSelectFrom: (versionId: string) => void;
  readonly onSelectTo: (versionId: string) => void;
  readonly onRetry: () => void;
}
