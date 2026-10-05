import { describe, expect, it } from 'vitest';
import {
  PromptNodeName,
  PromptSegmentKind,
} from '@/shared/prompt/constants/promptDocument.constants';
import {
  documentToPrompt,
  findVariableTrigger,
  formatVariableToken,
  parsePromptLine,
  PROMPT_VARIABLE_PASTE_PATTERN,
  PROMPT_VARIABLE_TYPED_PATTERN,
  promptToDocument,
} from '@/shared/prompt/helpers/promptDocument.helpers';
import type { PromptNodeLike } from '@/shared/prompt/typedefs/promptDocument.typedefs';

function node(
  name: string,
  options: { text?: string; path?: string; children?: PromptNodeLike[] } = {},
): PromptNodeLike {
  const children = options.children ?? [];
  return {
    type: { name },
    text: options.text ?? null,
    attrs: options.path === undefined ? {} : { path: options.path },
    forEach: (callback) => children.forEach((child) => callback(child)),
  };
}

describe('parsePromptLine', () => {
  it('splits text and variables in order', () => {
    expect(parsePromptLine('Hi {{contact.name}}, call {{contact.phone}}')).toEqual([
      { kind: PromptSegmentKind.Text, text: 'Hi ' },
      { kind: PromptSegmentKind.Variable, path: 'contact.name' },
      { kind: PromptSegmentKind.Text, text: ', call ' },
      { kind: PromptSegmentKind.Variable, path: 'contact.phone' },
    ]);
  });

  it('keeps unfinished braces as text', () => {
    expect(parsePromptLine('use {{ and {{name')).toEqual([
      { kind: PromptSegmentKind.Text, text: 'use {{ and {{name' },
    ]);
  });

  it('returns no segments for an empty line', () => {
    expect(parsePromptLine('')).toEqual([]);
  });
});

describe('promptToDocument', () => {
  it('makes one paragraph per line, with an empty paragraph for an empty line', () => {
    const doc = promptToDocument('a\n\n{{x}}');

    expect(doc.content).toEqual([
      { type: PromptNodeName.Paragraph, content: [{ type: PromptNodeName.Text, text: 'a' }] },
      { type: PromptNodeName.Paragraph },
      {
        type: PromptNodeName.Paragraph,
        content: [{ type: PromptNodeName.Variable, attrs: { path: 'x' } }],
      },
    ]);
  });

  it('has a single empty paragraph for an empty prompt', () => {
    expect(promptToDocument('').content).toEqual([{ type: PromptNodeName.Paragraph }]);
  });
});

describe('documentToPrompt', () => {
  it('joins paragraphs with new lines and writes variables as tokens', () => {
    const doc = node(PromptNodeName.Doc, {
      children: [
        node(PromptNodeName.Paragraph, {
          children: [
            node(PromptNodeName.Text, { text: 'Hi ' }),
            node(PromptNodeName.Variable, { path: 'contact.name' }),
          ],
        }),
        node(PromptNodeName.Paragraph),
        node(PromptNodeName.Paragraph, {
          children: [node(PromptNodeName.Text, { text: 'Bye' })],
        }),
      ],
    });

    expect(documentToPrompt(doc)).toBe('Hi {{contact.name}}\n\nBye');
  });
});

describe('findVariableTrigger', () => {
  it('finds the open braces and the query after them', () => {
    expect(findVariableTrigger('Call {{')).toEqual({ query: '', length: 2 });
    expect(findVariableTrigger('Call {{contact.ph')).toEqual({ query: 'contact.ph', length: 12 });
  });

  it('ignores braces that are closed or not at the caret', () => {
    expect(findVariableTrigger('Call {{contact.name}}')).toBeNull();
    expect(findVariableTrigger('Call {{ name')).toBeNull();
    expect(findVariableTrigger('Call {')).toBeNull();
  });
});

describe('token patterns', () => {
  it('matches a finished token at the end of typed text', () => {
    const match = PROMPT_VARIABLE_TYPED_PATTERN.exec('Hi {{contact.name}}');

    expect(match?.[1]).toBe('contact.name');
    expect(PROMPT_VARIABLE_TYPED_PATTERN.test('Hi {{contact.name}} there')).toBe(false);
  });

  it('matches every token in pasted text', () => {
    const paths = [...'{{a}} and {{b.c}}'.matchAll(PROMPT_VARIABLE_PASTE_PATTERN)].map(
      (match) => match[1],
    );

    expect(paths).toEqual(['a', 'b.c']);
  });

  it('formats a token', () => {
    expect(formatVariableToken('channel')).toBe('{{channel}}');
  });
});
