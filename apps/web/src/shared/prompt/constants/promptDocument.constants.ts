export {
  PROMPT_VARIABLE_CLOSE,
  PROMPT_VARIABLE_OPEN,
  PROMPT_VARIABLE_PATH_CHARACTERS,
} from '@agent-ic/flow';

export enum PromptNodeName {
  Doc = 'doc',
  Paragraph = 'paragraph',
  Text = 'text',
  Variable = 'variable',
}

export enum PromptSegmentKind {
  Text = 'text',
  Variable = 'variable',
}

export const PROMPT_LINE_SEPARATOR = '\n';
export const PROMPT_REGEXP_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/g;
export const PROMPT_REGEXP_ESCAPE_REPLACEMENT = '\\$&';
