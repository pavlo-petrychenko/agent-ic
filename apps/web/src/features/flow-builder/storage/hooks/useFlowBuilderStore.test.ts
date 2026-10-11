import { NodeType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_FLOW, HISTORY_LIMIT } from '@/features/flow-builder/constants/flowBuilder.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';

const store = useFlowBuilderStore.getState;
const withStep = (id: string, from: FlowDocument = store().document): FlowDocument => ({
  ...from,
  nodes: [
    ...from.nodes,
    {
      id,
      key: id,
      label: '',
      position: { x: 0, y: 0 },
      type: NodeType.Router,
      config: { rules: [] },
    },
  ],
});

describe('useFlowBuilderStore', () => {
  beforeEach(() => {
    store().load({ document: EMPTY_FLOW, revision: 3, issues: [] });
  });

  it('marks an edit as waiting to be saved', () => {
    store().apply(withStep('a'));

    expect(store().document.nodes).toHaveLength(1);
    expect(store().saveState).toBe(SaveState.Pending);
  });

  it('undoes and redoes edits in order', () => {
    store().apply(withStep('a'));
    store().apply(withStep('b'));

    store().undo();
    expect(store().document.nodes.map((node) => node.id)).toEqual(['a']);
    store().undo();
    expect(store().document).toBe(EMPTY_FLOW);
    store().redo();
    store().redo();
    expect(store().document.nodes.map((node) => node.id)).toEqual(['a', 'b']);
  });

  it('drops the redo steps after a new edit', () => {
    store().apply(withStep('a'));
    store().undo();
    store().apply(withStep('b'));
    store().redo();

    expect(store().document.nodes.map((node) => node.id)).toEqual(['b']);
  });

  it('does nothing when there is nothing to undo or redo', () => {
    store().undo();
    store().redo();

    expect(store().document).toBe(EMPTY_FLOW);
    expect(store().saveState).toBe(SaveState.Idle);
  });

  it(`keeps at most ${HISTORY_LIMIT} undo steps`, () => {
    for (let index = 0; index <= HISTORY_LIMIT; index += 1) {
      store().apply(withStep(`n${index}`));
    }

    expect(store().history.past).toHaveLength(HISTORY_LIMIT);
  });

  it('clears the selection of steps an undo removed', () => {
    store().apply(withStep('a'));
    store().select({ nodeIds: ['a'], edgeIds: [] });
    store().undo();

    expect(store().selection.nodeIds).toEqual([]);
  });

  it('starts a fresh history when a draft is loaded', () => {
    store().apply(withStep('a'));
    store().load({ document: withStep('b', EMPTY_FLOW), revision: 4, issues: [] });

    expect(store().history).toEqual({ past: [], future: [] });
    expect(store().revision).toBe(4);
    expect(store().saveState).toBe(SaveState.Idle);
  });

  it('takes the saved revision and the server issues', () => {
    store().apply(withStep('a'));
    store().markSaved(4, [], store().document);

    expect(store()).toMatchObject({ revision: 4, saveState: SaveState.Idle, issues: [] });
  });

  it('stays waiting to be saved when an edit came in during the save', () => {
    store().apply(withStep('a'));
    const saved = store().document;
    store().setSaveState(SaveState.Saving);
    store().apply(withStep('b'));
    store().markSaved(4, [], saved);

    expect(store()).toMatchObject({ revision: 4, saveState: SaveState.Pending });
  });

  it('keeps the conflict until the draft is reloaded', () => {
    store().apply(withStep('a'));
    store().setSaveState(SaveState.Conflict);
    store().apply(withStep('b'));
    store().undo();

    expect(store().saveState).toBe(SaveState.Conflict);
  });
});
