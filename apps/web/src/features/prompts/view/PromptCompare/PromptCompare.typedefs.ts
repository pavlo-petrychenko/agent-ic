import type { PromptDiffRow } from '@/features/prompts/typedefs/promptCompare.typedefs';

export interface PromptCompareVersion {
  readonly number: number;
  readonly date: string;
  readonly author: string | null;
  readonly note: string | null;
}

export interface PromptCompareProps {
  readonly from: PromptCompareVersion;
  readonly to: PromptCompareVersion;
  readonly rows: readonly PromptDiffRow[];
  readonly removed: number;
  readonly added: number;
}
