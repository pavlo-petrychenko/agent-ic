export enum PromptDiffLineKind {
  Context = 'context',
  Removed = 'removed',
  Added = 'added',
}

export enum PromptDiffSegmentKind {
  Text = 'text',
  Variable = 'variable',
}

export const PROMPT_DIFF_SIGN: Readonly<Record<PromptDiffLineKind, string>> = {
  [PromptDiffLineKind.Context]: '',
  [PromptDiffLineKind.Removed]: '−',
  [PromptDiffLineKind.Added]: '+',
};

export const PROMPT_DIFF_BLANK_LINE = '\u00A0';

export const PROMPT_COMPARE_ARROW_SIZE = 12;
