import {
  VARIABLE_CHIP_CLOSE,
  VARIABLE_CHIP_OPEN,
} from '@/shared/ui/VariableChip/VariableChip.constants';

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
export const PROMPT_VARIABLE_PATH_CHARACTERS = '[A-Za-z0-9_.-]';
export const PROMPT_VARIABLE_OPEN = VARIABLE_CHIP_OPEN;
export const PROMPT_VARIABLE_CLOSE = VARIABLE_CHIP_CLOSE;
export const PROMPT_REGEXP_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/g;
export const PROMPT_REGEXP_ESCAPE_REPLACEMENT = '\\$&';
