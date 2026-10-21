import { describe, expect, it } from 'vitest';
import {
  PromptDiffLineKind,
  PromptDiffSegmentKind,
} from '@/features/prompts/constants/promptCompare.constants';
import {
  diffPromptLines,
  toPromptDiffRows,
} from '@/features/prompts/logic/helpers/promptDiff.helpers';

describe('diffPromptLines', () => {
  it('keeps an unchanged text as context lines only', () => {
    const diff = diffPromptLines('One\nTwo', 'One\nTwo');

    expect(diff.lines).toEqual([
      { kind: PromptDiffLineKind.Context, text: 'One' },
      { kind: PromptDiffLineKind.Context, text: 'Two' },
    ]);
    expect(diff.removed).toBe(0);
    expect(diff.added).toBe(0);
  });

  it('marks a replaced line as one removed and one added', () => {
    const diff = diffPromptLines('One\nOld\nThree', 'One\nNew\nThree');

    expect(diff.lines).toEqual([
      { kind: PromptDiffLineKind.Context, text: 'One' },
      { kind: PromptDiffLineKind.Removed, text: 'Old' },
      { kind: PromptDiffLineKind.Added, text: 'New' },
      { kind: PromptDiffLineKind.Context, text: 'Three' },
    ]);
    expect(diff.removed).toBe(1);
    expect(diff.added).toBe(1);
  });

  it('marks appended lines as added after the shared context', () => {
    const diff = diffPromptLines('One', 'One\nTwo\nThree');

    expect(diff.lines).toEqual([
      { kind: PromptDiffLineKind.Context, text: 'One' },
      { kind: PromptDiffLineKind.Added, text: 'Two' },
      { kind: PromptDiffLineKind.Added, text: 'Three' },
    ]);
    expect(diff.added).toBe(2);
  });

  it('keeps the shared tail as context when lines are inserted', () => {
    const diff = diffPromptLines('One\nTwo\nThree', 'One\nTwo\nInserted\nThree');

    expect(diff.lines).toEqual([
      { kind: PromptDiffLineKind.Context, text: 'One' },
      { kind: PromptDiffLineKind.Context, text: 'Two' },
      { kind: PromptDiffLineKind.Added, text: 'Inserted' },
      { kind: PromptDiffLineKind.Context, text: 'Three' },
    ]);
    expect(diff.removed).toBe(0);
    expect(diff.added).toBe(1);
  });

  it('marks every line of an empty version as added', () => {
    const diff = diffPromptLines('', 'One\nTwo');

    expect(diff.added).toBe(2);
  });
});

describe('toPromptDiffRows', () => {
  it('splits variables into their own segments', () => {
    const rows = toPromptDiffRows([
      { kind: PromptDiffLineKind.Added, text: 'Talk to {{contact.name}} today.' },
    ]);

    expect(rows).toEqual([
      {
        kind: PromptDiffLineKind.Added,
        segments: [
          { kind: PromptDiffSegmentKind.Text, text: 'Talk to ' },
          { kind: PromptDiffSegmentKind.Variable, path: 'contact.name' },
          { kind: PromptDiffSegmentKind.Text, text: ' today.' },
        ],
      },
    ]);
  });

  it('keeps a blank line as a row without segments', () => {
    const rows = toPromptDiffRows([{ kind: PromptDiffLineKind.Context, text: '' }]);

    expect(rows).toEqual([{ kind: PromptDiffLineKind.Context, segments: [] }]);
  });
});
