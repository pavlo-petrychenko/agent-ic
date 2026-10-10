import { create } from 'zustand';
import {
  EMPTY_FLOW,
  EMPTY_SELECTION,
  INITIAL_VIEWPORT,
} from '@/features/flow-builder/constants/flowBuilder.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import {
  keepExisting,
  recordEdit,
  stepBack,
  stepForward,
} from '@/features/flow-builder/storage/helpers/history.helpers';
import type {
  FlowBuilderState,
  FlowBuilderStore,
  HistoryStep,
} from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

const INITIAL_STATE: FlowBuilderState = {
  document: EMPTY_FLOW,
  revision: 0,
  selection: EMPTY_SELECTION,
  viewport: INITIAL_VIEWPORT,
  history: { past: [], future: [] },
  saveState: SaveState.Idle,
  issues: [],
  previewOrigin: null,
};

const afterStep = (state: FlowBuilderState, step: HistoryStep | null): Partial<FlowBuilderState> =>
  step === null
    ? {}
    : {
        ...step,
        selection: keepExisting(state.selection, step.document),
        saveState: state.saveState === SaveState.Conflict ? SaveState.Conflict : SaveState.Pending,
      };

export const useFlowBuilderStore = create<FlowBuilderStore>()((set) => ({
  ...INITIAL_STATE,
  load: ({ document, revision, issues }) => set({ ...INITIAL_STATE, document, revision, issues }),
  apply: (document) =>
    set((state) => {
      const origin = state.previewOrigin ?? state.document;
      return document === origin
        ? { document, previewOrigin: null }
        : {
            ...afterStep(state, recordEdit(state.history, origin, document)),
            previewOrigin: null,
          };
    }),
  preview: (document) =>
    set((state) => ({ document, previewOrigin: state.previewOrigin ?? state.document })),
  undo: () => set((state) => afterStep(state, stepBack(state.history, state.document))),
  redo: () => set((state) => afterStep(state, stepForward(state.history, state.document))),
  select: (selection) => set({ selection }),
  setViewport: (viewport) => set({ viewport }),
  setSaveState: (saveState) => set({ saveState }),
  markSaved: (revision, issues, savedDocument) =>
    set((state) => ({
      revision,
      issues,
      saveState: state.document === savedDocument ? SaveState.Idle : SaveState.Pending,
    })),
}));
