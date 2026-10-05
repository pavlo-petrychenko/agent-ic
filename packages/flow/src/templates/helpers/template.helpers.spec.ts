import { describe, expect, it } from 'vitest';
import {
  PathSegmentKind,
  TemplateErrorReason,
  TemplateSegmentKind,
} from '@flow/templates/constants/template.constants';
import {
  parseTemplate,
  renderTemplate,
  templateReferences,
} from '@flow/templates/helpers/template.helpers';

describe('parseTemplate', () => {
  it('splits text and references with their positions', () => {
    expect(parseTemplate('Hi {{ user.name }}, see {{agent.messages[0]}}!')).toEqual([
      { kind: TemplateSegmentKind.Text, text: 'Hi ', start: 0, end: 3 },
      {
        kind: TemplateSegmentKind.Reference,
        path: 'user.name',
        segments: [
          { kind: PathSegmentKind.Name, name: 'user' },
          { kind: PathSegmentKind.Name, name: 'name' },
        ],
        raw: '{{ user.name }}',
        start: 3,
        end: 18,
      },
      { kind: TemplateSegmentKind.Text, text: ', see ', start: 18, end: 24 },
      {
        kind: TemplateSegmentKind.Reference,
        path: 'agent.messages[0]',
        segments: [
          { kind: PathSegmentKind.Name, name: 'agent' },
          { kind: PathSegmentKind.Name, name: 'messages' },
          { kind: PathSegmentKind.Index, index: 0 },
        ],
        raw: '{{agent.messages[0]}}',
        start: 24,
        end: 45,
      },
      { kind: TemplateSegmentKind.Text, text: '!', start: 45, end: 46 },
    ]);
  });

  it('gives plain text one segment and empty text none', () => {
    expect(parseTemplate('no tags } here }}')).toEqual([
      { kind: TemplateSegmentKind.Text, text: 'no tags } here }}', start: 0, end: 17 },
    ]);
    expect(parseTemplate('')).toEqual([]);
  });

  it('marks a reference with an invalid path', () => {
    expect(parseTemplate('a {{ guard reason }} b')[1]).toEqual({
      kind: TemplateSegmentKind.Invalid,
      reason: TemplateErrorReason.InvalidPath,
      raw: '{{ guard reason }}',
      start: 2,
      end: 20,
    });
    expect(parseTemplate('{{}}')[0]).toMatchObject({ reason: TemplateErrorReason.InvalidPath });
  });

  it('marks an unclosed reference up to the end of the text', () => {
    expect(parseTemplate('Hello {{user.name')).toEqual([
      { kind: TemplateSegmentKind.Text, text: 'Hello ', start: 0, end: 6 },
      {
        kind: TemplateSegmentKind.Invalid,
        reason: TemplateErrorReason.Unclosed,
        raw: '{{user.name',
        start: 6,
        end: 17,
      },
    ]);
  });
});

describe('templateReferences', () => {
  it('lists only the valid references', () => {
    expect(
      templateReferences('{{a.b}} {{ bad path }} {{today}} {{c').map((reference) => reference.path),
    ).toEqual(['a.b', 'today']);
  });
});

describe('renderTemplate', () => {
  const values: Record<string, unknown> = {
    'user.name': 'Olena',
    'guard.score': 7,
    'guard.ok': false,
    'load.body': { eta: 'Monday' },
    'agent.messages': ['a', 'b'],
  };
  const resolve = (path: string): unknown => values[path];

  it('fills references with their values', () => {
    expect(renderTemplate('Hi {{ user.name }}, score {{guard.score}}, {{guard.ok}}', resolve)).toBe(
      'Hi Olena, score 7, false',
    );
  });

  it('renders a missing value as empty text', () => {
    expect(renderTemplate('[{{event.order.id}}]', resolve)).toBe('[]');
  });

  it('renders objects and lists as JSON', () => {
    expect(renderTemplate('{{load.body}} {{agent.messages}}', resolve)).toBe(
      '{"eta":"Monday"} ["a","b"]',
    );
  });

  it('keeps invalid references as written', () => {
    expect(renderTemplate('{{ not valid }} and {{open', resolve)).toBe(
      '{{ not valid }} and {{open',
    );
  });
});
