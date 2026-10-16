import { beforeEach, describe, expect, it } from 'vitest';
import {
  readPromptDraft,
  storePromptDraft,
} from '@/features/prompts/storage/helpers/promptDraftStorage.helpers';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';

const SEED = { text: 'Version text', baseVersionNumber: 4 };

describe('prompt drafts store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    usePromptDraftsStore.setState({ drafts: {} });
  });

  it('creates a draft from the latest version on begin', () => {
    usePromptDraftsStore.getState().begin('prm_1', SEED);

    const draft = usePromptDraftsStore.getState().drafts['prm_1'];
    expect(draft?.text).toBe('Version text');
    expect(draft?.baseVersionNumber).toBe(4);
    expect(readPromptDraft('prm_1')?.text).toBe('Version text');
  });

  it('keeps an existing draft when begin is called again', () => {
    usePromptDraftsStore.getState().begin('prm_1', SEED);
    usePromptDraftsStore.getState().update('prm_1', 'Edited');
    usePromptDraftsStore.getState().begin('prm_1', { text: 'Other', baseVersionNumber: 5 });

    expect(usePromptDraftsStore.getState().drafts['prm_1']?.text).toBe('Edited');
  });

  it('persists an update', () => {
    usePromptDraftsStore.getState().begin('prm_1', SEED);
    usePromptDraftsStore.getState().update('prm_1', 'Edited');

    expect(readPromptDraft('prm_1')?.text).toBe('Edited');
  });

  it('ignores an update without a draft', () => {
    usePromptDraftsStore.getState().update('prm_1', 'Edited');

    expect(usePromptDraftsStore.getState().drafts['prm_1']).toBeUndefined();
    expect(readPromptDraft('prm_1')).toBeNull();
  });

  it('loads drafts stored in the browser', () => {
    storePromptDraft('prm_2', {
      text: 'Stored draft',
      baseVersionNumber: null,
      savedAt: '2026-10-16T14:20:00.000Z',
    });
    usePromptDraftsStore.getState().load();

    expect(usePromptDraftsStore.getState().drafts['prm_2']?.text).toBe('Stored draft');
  });

  it('discards a draft from the state and the storage', () => {
    usePromptDraftsStore.getState().begin('prm_1', SEED);
    usePromptDraftsStore.getState().discard('prm_1');

    expect(usePromptDraftsStore.getState().drafts['prm_1']).toBeUndefined();
    expect(readPromptDraft('prm_1')).toBeNull();
  });
});
