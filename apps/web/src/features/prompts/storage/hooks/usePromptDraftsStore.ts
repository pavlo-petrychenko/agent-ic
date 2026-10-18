import { create } from 'zustand';
import {
  readPromptDraft,
  readPromptDraftIds,
  removePromptDraft,
  storePromptDraft,
} from '@/features/prompts/storage/helpers/promptDraftStorage.helpers';
import type {
  PromptDraft,
  PromptDraftsStore,
} from '@/features/prompts/typedefs/promptDraft.typedefs';

const readStoredDrafts = (): Readonly<Record<string, PromptDraft>> => {
  const drafts: Record<string, PromptDraft> = {};
  for (const promptId of readPromptDraftIds()) {
    const draft = readPromptDraft(promptId);
    if (draft !== null) {
      drafts[promptId] = draft;
    }
  }
  return drafts;
};

export const usePromptDraftsStore = create<PromptDraftsStore>()((set, get) => ({
  drafts: {},
  load: () => set({ drafts: readStoredDrafts() }),
  begin: (promptId, draft) => {
    if (get().drafts[promptId] !== undefined) {
      return;
    }
    storePromptDraft(promptId, draft);
    set((state) => ({ drafts: { ...state.drafts, [promptId]: draft } }));
  },
  update: (promptId, text) => {
    const current = get().drafts[promptId];
    if (current === undefined) {
      return;
    }
    const draft: PromptDraft = { ...current, text };
    storePromptDraft(promptId, draft);
    set((state) => ({ drafts: { ...state.drafts, [promptId]: draft } }));
  },
  discard: (promptId) => {
    removePromptDraft(promptId);
    set((state) => {
      const drafts = { ...state.drafts };
      delete drafts[promptId];
      return { drafts };
    });
  },
}));
