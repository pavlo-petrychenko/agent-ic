import { useState } from 'react';
import type { UsePromptDraftSessionResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { nextPromptVersionNumber } from '@/features/prompts/logic/helpers/promptDraft.helpers';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import type { PromptVersion } from '@/features/prompts/typedefs/prompt.typedefs';

export function usePromptDraftSession(
  promptId: string,
  latestVersion: PromptVersion | null,
): UsePromptDraftSessionResult {
  const draft = usePromptDraftsStore((state) => state.drafts[promptId] ?? null);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const draftNumber = nextPromptVersionNumber(latestVersion?.number ?? null);
  const editorText = draft === null ? (latestVersion?.text ?? '') : draft.text;

  const startEditing = () => {
    usePromptDraftsStore.getState().begin(promptId, {
      text: latestVersion?.text ?? '',
      baseVersionNumber: latestVersion?.number ?? null,
    });
  };

  const changeText = (text: string) => {
    usePromptDraftsStore.getState().update(promptId, text);
  };

  const finishSaving = () => {
    usePromptDraftsStore.getState().discard(promptId);
    setSaving(false);
  };

  const finishDiscarding = () => {
    usePromptDraftsStore.getState().discard(promptId);
    setDiscarding(false);
  };

  return {
    editing: draft !== null,
    draft,
    draftNumber,
    editorText,
    saving,
    discarding,
    startEditing,
    changeText,
    openSaveDialog: () => setSaving(true),
    closeSaveDialog: () => setSaving(false),
    finishSaving,
    openDiscardDialog: () => setDiscarding(true),
    closeDiscardDialog: () => setDiscarding(false),
    finishDiscarding,
  };
}
