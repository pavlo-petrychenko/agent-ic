import { FLOW_SCHEMA_VERSION, FlowIssueSeverity } from '@agent-ic/flow';
import type { FieldChange, FlowDocument, FlowIssue } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ChangeSentence, PublishBlock } from '@/features/flow-builder/constants/publish.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import {
  formatTimeAgo,
  publishBlockOf,
  toChangeLines,
} from '@/features/flow-builder/logic/helpers/publish.helpers';
import type {
  PublishDiff,
  PublishPreview,
} from '@/features/flow-builder/typedefs/publish.typedefs';

const EMPTY_DIFF: PublishDiff = {
  addedNodes: [],
  removedNodes: [],
  changedNodes: [],
  renamedKeys: [],
  addedEdges: [],
  removedEdges: [],
  changeCount: 0,
};

const DOCUMENT = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    { id: 'a', key: 'schedule', label: 'Schedule trigger' },
    { id: 'b', key: 'reply', label: '' },
  ],
  edges: [],
} as unknown as FlowDocument;

const fieldLines = (...fields: FieldChange[]) =>
  toChangeLines(
    { ...EMPTY_DIFF, changedNodes: [{ nodeId: 'a', key: 'schedule', fields }] },
    DOCUMENT,
  );

describe('toChangeLines', () => {
  it('words a changed short value as the new one instead of the old one', () => {
    expect(
      fieldLines({ path: ['config', 'schedule', 'time'], before: '19:00', after: '18:00' }),
    ).toEqual([
      expect.objectContaining({
        sentence: ChangeSentence.ValueChanged,
        step: 'Schedule trigger',
        field: 'schedule',
        before: '19:00',
        after: '18:00',
      }),
    ]);
  });

  it('picks the sentence for each kind of field change', () => {
    const sentences = fieldLines(
      { path: ['config', 'typing'], before: false, after: true },
      { path: ['config', 'waitForDelivery'], before: true, after: false },
      { path: ['config', 'reason'], before: null, after: 'refund' },
      { path: ['config', 'url'], before: 'https://a.test', after: '' },
      { path: ['config', 'prompt', 'text'], before: 'short', after: 'x'.repeat(80) },
      { path: ['config', 'rules'], before: [], after: [{}] },
      { path: ['label'], before: 'Old name', after: 'Schedule trigger' },
      { path: ['position', 'x'], before: 0, after: 10 },
    ).map((line) => line.sentence);

    expect(sentences).toEqual([
      ChangeSentence.TurnedOn,
      ChangeSentence.TurnedOff,
      ChangeSentence.ValueSet,
      ChangeSentence.ValueCleared,
      ChangeSentence.Edited,
      ChangeSentence.Edited,
      ChangeSentence.StepRenamed,
    ]);
  });

  it('lists added, renamed and removed steps and skips edges of added or removed steps', () => {
    const lines = toChangeLines(
      {
        ...EMPTY_DIFF,
        addedNodes: [{ id: 'c', key: 'follow', label: 'Follow-up' }],
        removedNodes: [{ id: 'd', key: 'old', label: '' }],
        renamedKeys: [{ nodeId: 'b', from: 'answer', to: 'reply' }],
        addedEdges: [
          { source: 'a', target: 'b' },
          { source: 'b', target: 'c' },
        ],
        removedEdges: [{ source: 'a', target: 'd' }],
      },
      DOCUMENT,
    );

    expect(
      lines.map(({ sentence, step, before, after }) => [sentence, step, before, after]),
    ).toEqual([
      [ChangeSentence.StepAdded, 'Follow-up', null, null],
      [ChangeSentence.StepRenamed, 'reply', 'answer', null],
      [ChangeSentence.StepRemoved, 'old', null, null],
      [ChangeSentence.Connected, 'Schedule trigger', null, 'reply'],
    ]);
  });

  it('shows one rename line when a step changes its name and its key', () => {
    const lines = toChangeLines(
      {
        ...EMPTY_DIFF,
        changedNodes: [
          {
            nodeId: 'a',
            key: 'schedule',
            fields: [{ path: ['label'], before: 'Old', after: 'New' }],
          },
        ],
        renamedKeys: [{ nodeId: 'a', from: 'old', to: 'schedule' }],
      },
      DOCUMENT,
    );

    expect(lines.map(({ sentence, before }) => [sentence, before])).toEqual([
      [ChangeSentence.StepRenamed, 'Old'],
    ]);
  });
});

const ERROR = { severity: FlowIssueSeverity.Error } as FlowIssue;
const preview = (overrides: Partial<PublishPreview>): PublishPreview => ({
  draftNumber: 4,
  liveVersion: 3,
  diff: EMPTY_DIFF,
  errors: [],
  errorCount: 0,
  warnings: [],
  testedAt: null,
  ...overrides,
});
const LINES = fieldLines({ path: ['config', 'typing'], before: false, after: true });

describe('publishBlockOf', () => {
  it('blocks on a conflict, a failed save, unsaved edits, errors and an unchanged flow', () => {
    const failing = preview({ errors: [ERROR], errorCount: 1 });
    expect(publishBlockOf(SaveState.Conflict, failing, [])).toBe(PublishBlock.Conflict);
    expect(publishBlockOf(SaveState.Error, failing, LINES)).toBe(PublishBlock.SaveFailed);
    expect(publishBlockOf(SaveState.Saving, failing, LINES)).toBe(PublishBlock.Unsaved);
    expect(publishBlockOf(SaveState.Idle, failing, LINES)).toBe(PublishBlock.Errors);
    expect(publishBlockOf(SaveState.Idle, preview({ errorCount: 1 }), LINES)).toBe(
      PublishBlock.Errors,
    );
    expect(publishBlockOf(SaveState.Idle, preview({}), [])).toBe(PublishBlock.NoChanges);
  });

  it('lets a changed or never published flow through', () => {
    expect(publishBlockOf(SaveState.Idle, preview({}), LINES)).toBeNull();
    expect(publishBlockOf(SaveState.Idle, preview({ liveVersion: null }), [])).toBeNull();
  });
});

describe('formatTimeAgo', () => {
  const now = Date.parse('2026-10-11T12:00:00Z');

  it('uses minutes, hours or days', () => {
    expect(formatTimeAgo('2026-10-11T11:52:00Z', now, 'en')).toBe('8 minutes ago');
    expect(formatTimeAgo('2026-10-11T09:00:00Z', now, 'en')).toBe('3 hours ago');
    expect(formatTimeAgo('2026-10-09T12:00:00Z', now, 'en')).toBe('2 days ago');
  });
});
