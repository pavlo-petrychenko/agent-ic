import { describe, expect, it } from 'vitest';
import {
  PromptNodeName,
  PromptSegmentKind,
} from '@/shared/prompt/constants/promptDocument.constants';
import {
  collectPromptVariables,
  documentToPrompt,
  findVariableTrigger,
  formatVariableToken,
  normalizePathVariable,
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

  it('keeps variable names as written by default', () => {
    expect(parsePromptLine('Hi {{Contact.Name}}')).toEqual([
      { kind: PromptSegmentKind.Text, text: 'Hi ' },
      { kind: PromptSegmentKind.Variable, path: 'Contact.Name' },
    ]);
  });

  it('normalizes variable names when a normalizer is given', () => {
    expect(parsePromptLine('Hi {{Contact.Name}}', normalizePathVariable)).toEqual([
      { kind: PromptSegmentKind.Text, text: 'Hi ' },
      { kind: PromptSegmentKind.Variable, path: 'contact.name' },
    ]);
  });

  it('returns no segments for an empty line', () => {
    expect(parsePromptLine('')).toEqual([]);
  });
});

describe('collectPromptVariables', () => {
  it('lists every variable path once, in the order it appears', () => {
    expect(
      collectPromptVariables('Hi {{contact.name}}\nBye {{channel}} and {{contact.name}}'),
    ).toEqual(['contact.name', 'channel']);
  });

  it('ignores unfinished braces', () => {
    expect(collectPromptVariables('use {{ and {{name')).toEqual([]);
  });

  it('treats names that differ only by case as one variable when normalized', () => {
    expect(
      collectPromptVariables('{{Name}} and {{name}} and {{NAME}}', normalizePathVariable),
    ).toEqual(['name']);
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

  it('keeps variable names as written by default', () => {
    expect(promptToDocument('{{Contact.Name}}').content).toEqual([
      {
        type: PromptNodeName.Paragraph,
        content: [{ type: PromptNodeName.Variable, attrs: { path: 'Contact.Name' } }],
      },
    ]);
  });

  it('writes variable names in lowercase when normalized', () => {
    expect(promptToDocument('{{Contact.Name}}', normalizePathVariable).content).toEqual([
      {
        type: PromptNodeName.Paragraph,
        content: [{ type: PromptNodeName.Variable, attrs: { path: 'contact.name' } }],
      },
    ]);
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
