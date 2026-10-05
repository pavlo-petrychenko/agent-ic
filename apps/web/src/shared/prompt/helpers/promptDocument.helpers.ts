import {
  PROMPT_LINE_SEPARATOR,
  PROMPT_REGEXP_ESCAPE_PATTERN,
  PROMPT_REGEXP_ESCAPE_REPLACEMENT,
  PROMPT_VARIABLE_CLOSE,
  PROMPT_VARIABLE_OPEN,
  PROMPT_VARIABLE_PATH_CHARACTERS,
  PromptNodeName,
  PromptSegmentKind,
} from '@/shared/prompt/constants/promptDocument.constants';
import type {
  PromptDocumentJson,
  PromptNodeLike,
  PromptParagraphNode,
  PromptSegment,
  PromptTriggerMatch,
} from '@/shared/prompt/typedefs/promptDocument.typedefs';

const escapeRegExp = (source: string): string =>
  source.replace(PROMPT_REGEXP_ESCAPE_PATTERN, PROMPT_REGEXP_ESCAPE_REPLACEMENT);

const OPEN = escapeRegExp(PROMPT_VARIABLE_OPEN);
const CLOSE = escapeRegExp(PROMPT_VARIABLE_CLOSE);
const PATH = `${PROMPT_VARIABLE_PATH_CHARACTERS}+`;
const TOKEN_SOURCE = `${OPEN}(${PATH})${CLOSE}`;

export const PROMPT_VARIABLE_TYPED_PATTERN = new RegExp(`${TOKEN_SOURCE}$`);
export const PROMPT_VARIABLE_PASTE_PATTERN = new RegExp(TOKEN_SOURCE, 'g');
const TRIGGER_PATTERN = new RegExp(`${OPEN}(${PROMPT_VARIABLE_PATH_CHARACTERS}*)$`);

export const formatVariableToken = (path: string): string =>
  `${PROMPT_VARIABLE_OPEN}${path}${PROMPT_VARIABLE_CLOSE}`;

export function parsePromptLine(line: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  let cursor = 0;
  for (const match of line.matchAll(PROMPT_VARIABLE_PASTE_PATTERN)) {
    const path = match[1];
    if (path === undefined) {
      continue;
    }
    if (match.index > cursor) {
      segments.push({ kind: PromptSegmentKind.Text, text: line.slice(cursor, match.index) });
    }
    segments.push({ kind: PromptSegmentKind.Variable, path });
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) {
    segments.push({ kind: PromptSegmentKind.Text, text: line.slice(cursor) });
  }
  return segments;
}

function toParagraph(line: string): PromptParagraphNode {
  const segments = parsePromptLine(line);
  if (segments.length === 0) {
    return { type: PromptNodeName.Paragraph };
  }
  return {
    type: PromptNodeName.Paragraph,
    content: segments.map((segment) =>
      segment.kind === PromptSegmentKind.Variable
        ? { type: PromptNodeName.Variable as const, attrs: { path: segment.path } }
        : { type: PromptNodeName.Text as const, text: segment.text },
    ),
  };
}

export const promptToDocument = (value: string): PromptDocumentJson => ({
  type: PromptNodeName.Doc,
  content: value.split(PROMPT_LINE_SEPARATOR).map(toParagraph),
});

function serializeInline(node: PromptNodeLike): string {
  if (node.type.name === PromptNodeName.Variable) {
    const path = node.attrs['path'];
    return typeof path === 'string' ? formatVariableToken(path) : '';
  }
  return node.text ?? '';
}

export function documentToPrompt(doc: PromptNodeLike): string {
  const lines: string[] = [];
  doc.forEach((paragraph) => {
    let line = '';
    paragraph.forEach((child) => {
      line += serializeInline(child);
    });
    lines.push(line);
  });
  return lines.join(PROMPT_LINE_SEPARATOR);
}

export function findVariableTrigger(textBefore: string): PromptTriggerMatch | null {
  const match = TRIGGER_PATTERN.exec(textBefore);
  const query = match?.[1];
  if (match === null || query === undefined) {
    return null;
  }
  return { query, length: match[0].length };
}
