import type {
  PromptDiffLineKind,
  PromptDiffSegmentKind,
} from '@/features/prompts/constants/promptCompare.constants';

export interface PromptDiffLine {
  readonly kind: PromptDiffLineKind;
  readonly text: string;
}

export interface PromptDiff {
  readonly lines: readonly PromptDiffLine[];
  readonly removed: number;
  readonly added: number;
}

export type PromptDiffSegment =
  | { readonly kind: PromptDiffSegmentKind.Text; readonly text: string }
  | { readonly kind: PromptDiffSegmentKind.Variable; readonly path: string };

export interface PromptDiffRow {
  readonly kind: PromptDiffLineKind;
  readonly segments: readonly PromptDiffSegment[];
}
